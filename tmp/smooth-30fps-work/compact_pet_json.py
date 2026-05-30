import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PET_JSON = ROOT / "web" / "assets" / "pets" / "luyi-nui" / "pet.json"


def inline_value(value):
    return json.dumps(value, ensure_ascii=False, separators=(", ", ": "))


def write_compact_pet_json():
    pet = json.loads(PET_JSON.read_text(encoding="utf-8"))
    lines = [
        "{",
        f'  "id": {inline_value(pet["id"])},',
        f'  "displayName": {inline_value(pet["displayName"])},',
        f'  "description": {inline_value(pet["description"])},',
        f'  "spritesheetPath": {inline_value(pet["spritesheetPath"])},',
        '  "grid": {',
        f'    "columns": {pet["grid"]["columns"]},',
        f'    "rows": {pet["grid"]["rows"]},',
        f'    "frameWidth": {pet["grid"]["frameWidth"]},',
        f'    "frameHeight": {pet["grid"]["frameHeight"]}',
        "  },",
        '  "animations": {',
    ]

    animations = list(pet["animations"].items())
    for index, (name, animation) in enumerate(animations):
        suffix = "," if index < len(animations) - 1 else ""
        lines.append(f'    "{name}": {inline_value(animation)}{suffix}')
    lines.append("  },")

    remaining = [
        "actionAliases",
        "menuActions",
        "dragActionsByDirection",
        "slideStopActionsByDirection",
        "diagonalPounceActionsByDirection",
        "diagonalPounceLandingActionsByDirection",
        "dragActions",
        "dragAction",
        "defaultAction",
        "actionNotes",
        "animationGroups",
        "bubbleText",
    ]
    for index, key in enumerate(remaining):
        suffix = "," if index < len(remaining) - 1 else ""
        lines.append(f'  "{key}": {inline_value(pet[key])}{suffix}')
    lines.append("}")
    PET_JSON.write_text("\n".join(lines) + "\n", encoding="utf-8")


if __name__ == "__main__":
    write_compact_pet_json()
