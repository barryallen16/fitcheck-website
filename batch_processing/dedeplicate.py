import json

def remove_duplicate_combinations(input_filepath, output_filepath):
    # 1. Read the JSON file
    with open(input_filepath, 'r') as file:
        data = json.load(file)

    unique_items = []
    seen_combinations = set()

    # 2. Iterate through the records
    for item in data:
        # Extract the fields safely using .get() in case a label is missing
        top = item.get("top_label", "")
        bottom = item.get("bottom_label", "")
        
        # Create a tuple of the two labels. 
        # Python automatically hashes this tuple when checking/adding to the set.
        combination_key = (top, bottom)

        # 3. Filter based on the top/bottom combination
        if combination_key not in seen_combinations:
            seen_combinations.add(combination_key)
            unique_items.append(item) # Keep the whole original JSON object

    # 4. Write the clean data back to a new file
    with open(output_filepath, 'w') as file:
        json.dump(unique_items, file, indent=4)
        
    print(f"Original count: {len(data)}")
    print(f"Unique count: {len(unique_items)}")

# --- Run the code ---
remove_duplicate_combinations('./batch_25.json', './batch-1-de.json')