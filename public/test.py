import json

# Define the path to your JSON file
file_path = 'wardrobe_export.json'
new_list =[]
try:
    with open(file_path, 'r') as file:
        # Load the contents into a Python variable
        data = json.load(file)
        wardrobe_data = data['wardrobe']
        for data in wardrobe_data:
            new_list.append(data["analysis"])

    # Access data like a normal dictionary
    print(new_list)
except FileNotFoundError:
    print(f"Error: The file {file_path} was not found.")
except json.JSONDecodeError:
    print(f"Error: Failed to decode JSON from {file_path}.")