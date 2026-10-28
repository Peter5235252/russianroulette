use serde_json::{json, Value};
use wasm_bindgen::prelude::*;

fn next_random(state: &mut u32) -> u32 {
    if *state == 0 { *state = 0xA341_316C; }
    let mut value = *state;
    value ^= value << 13;
    value ^= value >> 17;
    value ^= value << 5;
    *state = value;
    value
}

#[wasm_bindgen]
pub fn start_round(seed: u32) -> String {
    let mut random_state = seed;
    let live_count = (next_random(&mut random_state) % 5) + 1;
    let mut chambers: Vec<Value> = (0..6).map(|_| json!({"isLive": false, "isSpent": false})).collect();
    for chamber in chambers.iter_mut().take(live_count as usize) {
        chamber["isLive"] = json!(true);
    }
    for index in (1..chambers.len()).rev() {
        let swap_index = (next_random(&mut random_state) as usize) % (index + 1);
        chambers.swap(index, swap_index);
    }
    serde_json::to_string(&json!({"liveCount": live_count, "chambers": chambers}))
        .unwrap_or_else(|_| "{\"liveCount\":1,\"chambers\":[]}".to_string())
}

#[wasm_bindgen]
pub fn resolve_shot_damage(base_damage: u32, is_self_shot: bool, double_damage_active: bool, target_protected: bool) -> u32 {
    let mut damage = base_damage;
    if is_self_shot { damage = damage.saturating_mul(2); }
    if double_damage_active { damage = damage.saturating_mul(2); }
    if target_protected { damage = damage.saturating_sub(30); }
    damage
}

fn number(value: &Value, key: &str, fallback: i64) -> i64 {
    value.get(key).and_then(Value::as_i64).unwrap_or(fallback)
}
fn actor_key(user: &str) -> &'static str {
    if user == "player" { "player" } else { "dealer" }
}
fn put_actor(patch: &mut Value, key: &str, actor: Value) {
    patch[key] = actor;
}
fn chambers_len(state: &Value) -> usize {
    state.get("chambers").and_then(Value::as_array).map(|items| items.len().max(1)).unwrap_or(1)
}

#[wasm_bindgen]
pub fn apply_item(state_json: &str, item: &str, user: &str, now_ms: f64) -> String {
    let state: Value = serde_json::from_str(state_json).unwrap_or_else(|_| json!({}));
    let actor_name = actor_key(user);
    let other_name = if actor_name == "player" { "dealer" } else { "player" };
    let mut initial_patch = json!({});
    let mut follow_up_patch = json!({});
    let mut wait_time_ms = 2200_u32;
    let mut follow_up_delay_ms = 0_u32;
    let mut actor = state.get(actor_name).cloned().unwrap_or_else(|| json!({"health":100,"maxHealth":100,"items":[]}));

    match item {
        "MIRROR" => {
            let index = state.get("currentChamberIndex").and_then(Value::as_u64).unwrap_or(0) as usize;
            let live = state.get("chambers").and_then(Value::as_array)
                .and_then(|list| list.get(index))
                .and_then(|chamber| chamber.get("isLive")).and_then(Value::as_bool).unwrap_or(false);
            initial_patch["subMessage"] = json!(if actor_name == "player" {
                if live { "You see a live round inside." } else { "You see an empty chamber." }
            } else { "The Dealer inspects the chamber." });
        }
        "PLIERS" => {
            let mut chambers = state.get("chambers").and_then(Value::as_array).cloned().unwrap_or_default();
            let index = state.get("currentChamberIndex").and_then(Value::as_u64).unwrap_or(0) as usize;
            let live = chambers.get(index).and_then(|c| c.get("isLive")).and_then(Value::as_bool).unwrap_or(false);
            if let Some(chamber) = chambers.get_mut(index) { chamber["isSpent"] = json!(true); }
            actor["health"] = json!(number(&actor, "health", 100).saturating_sub(5).max(1));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["chambers"] = json!(chambers);
            initial_patch["currentChamberIndex"] = json!((index + 1) % chambers_len(&state));
            initial_patch["subMessage"] = json!(format!("Shell ejected. It was a {}.", if live { "live round" } else { "blank" }));
        }
        "WHISKEY" => {
            actor["health"] = json!((number(&actor, "health", 100) + 20).min(number(&actor, "maxHealth", 100)));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["subMessage"] = json!("Pain numbed. Vitality restored.");
        }
        "TOURNIQUET" => {
            actor["maxHealth"] = json!(number(&actor, "maxHealth", 100) + 1);
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["subMessage"] = json!("Braced for impact. Adrenaline surges.");
        }
        "PENTAGRAM" => {
            let mut other = state.get(other_name).cloned().unwrap_or_else(|| json!({"health":100,"maxHealth":100,"items":[]}));
            let actor_health = number(&actor, "health", 100);
            let other_health = number(&other, "health", 100);
            actor["health"] = json!(other_health);
            other["health"] = json!(actor_health);
            put_actor(&mut initial_patch, actor_name, actor);
            put_actor(&mut initial_patch, other_name, other);
            initial_patch["subMessage"] = json!("Dark bargain struck. Life essence swapped.");
        }
        "CIGARETTE" => {
            let reduction_key = if actor_name == "player" { "playerDamageReductionEnd" } else { "dealerDamageReductionEnd" };
            initial_patch[reduction_key] = json!(now_ms + 20_000.0);
            initial_patch["subMessage"] = json!(if actor_name == "player" {
                "You light a cigarette. Nerves steady as smoke fills your lungs."
            } else { "The Dealer lights a cigarette and inhales a deep drag." });
            wait_time_ms = 3200;
        }
        "SCALPEL" => {
            initial_patch["doubleDamageActive"] = json!(actor_name);
            initial_patch["subMessage"] = json!("The barrel is sawn off. Double damage next shot.");
            wait_time_ms = 3800;
        }
        "DEFIBRILLATOR" => {
            let max_health = number(&actor, "maxHealth", 100);
            actor["health"] = json!((number(&actor, "health", 100) + 40).min(max_health - 10));
            actor["maxHealth"] = json!(max_health.saturating_sub(10).max(10));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["subMessage"] = json!("A violent jolt. Vitality restored, but max health is permanently reduced.");
        }
        "MEDKIT" => {
            actor["health"] = json!(number(&actor, "maxHealth", 100));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["subMessage"] = json!("Critical wounds patched. Fully restored.");
        }
        "SYRINGE" => {
            actor["health"] = json!((number(&actor, "health", 100) + 50).min(number(&actor, "maxHealth", 100)));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["subMessage"] = json!("Instant surge. 50 HP restored.");
        }
        "RAZORBLADE" => {
            actor["health"] = json!(number(&actor, "health", 100).saturating_sub(10).max(1));
            put_actor(&mut initial_patch, actor_name, actor);
            initial_patch["bloodLevel"] = json!(180);
            initial_patch["subMessage"] = json!("Slashing flesh with the razorblade...");
            let mut chambers = state.get("chambers").and_then(Value::as_array).cloned().unwrap_or_default();
            let index = state.get("currentChamberIndex").and_then(Value::as_u64).unwrap_or(0) as usize;
            let was_live = chambers.get(index).and_then(|c| c.get("isLive")).and_then(Value::as_bool).unwrap_or(false);
            if was_live {
                follow_up_patch["doubleDamageActive"] = json!(actor_name);
                follow_up_patch["subMessage"] = json!("The chamber was already live. Double damage active.");
            } else {
                if let Some(chamber) = chambers.get_mut(index) { chamber["isLive"] = json!(true); }
                follow_up_patch["chambers"] = json!(chambers);
                follow_up_patch["subMessage"] = json!("Blood seals the blank. It's now a live round.");
            }
            follow_up_delay_ms = 1000;
        }
        _ => initial_patch["subMessage"] = json!("Nothing happened."),
    }

    serde_json::to_string(&json!({
        "initialPatch": initial_patch,
        "followUpPatch": follow_up_patch,
        "waitTimeMs": wait_time_ms,
        "followUpDelayMs": follow_up_delay_ms
    })).unwrap_or_else(|_| "{\"initialPatch\":{},\"followUpPatch\":{},\"waitTimeMs\":2200,\"followUpDelayMs\":0}".to_string())
}
