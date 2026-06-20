import json

# 1. Your optimized template
PROMPT_TEMPLATE = """You are a fashion styling AI. Generate exactly ONE unique, weather-appropriate outfit combination from the provided WARDROBE DESCRIPTIONS. 

Output ONLY a valid, raw JSON object. Do not include markdown formatting, code blocks (```), or conversational text.

RULES:
1. Pair ONE top and ONE bottom. 
   - Tops include: kurta, kurti, blouse, shirt, tee, top, jacket, vest, kaftan.
   - Bottoms include: churidar, palazzo, dhoti, lehenga, skirt, trousers, jeans, shorts, salwar.
2. FULL-BODY EXCEPTION: If an item is a complete outfit by itself (e.g., saree, dress, jumpsuit, gown, anarkali), set "top_label" to that item's label, and set "bottom_label" strictly to "COMPLETE_OUTFIT".
3. Aesthetic & Weather: The pair must match in color harmony, silhouette balance, and be comfortable for the CURRENT WEATHER.
4. REJECTED PAIRS: You must NOT generate any exact top/bottom label combinations listed in the REJECTED PAIRS section.

JSON SCHEMA:
{{"top_label": "string", "bottom_label": "string", "colorLogic": "string", "silhouetteLogic": "string", "occasion": "string"}}

CURRENT WEATHER: 
{api_temp}°C, {api_condition}

WARDROBE DESCRIPTIONS:
{wardrobe_data}

REJECTED PAIRS:
{rejected_data}

OUTPUT:"""

# 2. Hardcoded Wardrobe Data (Truncated here for readability, paste your full 44 items)
WARDROBE_DESCRIPTIONS = """
1. **LABEL:** "IvoryLinenKurta" – **DESCRIPTION:** Ivory linen kurta with band collar, straight fit, knee-length, side slits – airy men’s festive staple for beach-side functions.  
2. **LABEL:** "SeafoamCottonSilkKurta" – **DESCRIPTION:** Seafoam green cotton-silk kurta with subtle self-jacquard, full sleeves – refined day-to-evening ethnic top.  
3. **LABEL:** "CoralShortKurta" – **DESCRIPTION:** Coral cotton short kurta with half placket and roll-tab sleeves – bright mehendi/haldi-ready top.  
4. **LABEL:** "CobaltKhadiKurta" – **DESCRIPTION:** Cobalt blue handspun khadi kurta, relaxed straight cut, textured handfeel – craft-forward festive comfort.  
5. **LABEL:** "SandPathaniKurtaTop" – **DESCRIPTION:** Sand beige Pathani-style kurta top with flap chest pockets and straight hem – rugged ethnic top for travel and casual nights.  
6. **LABEL:** "WhitePoplinDressShirt" – **DESCRIPTION:** Crisp white poplin dress shirt with spread collar – clean western base for suits and bandis.  
7. **LABEL:** "SkyBlueOxfordShirt" – **DESCRIPTION:** Sky blue oxford button-down shirt, classic fit – smart-casual brunch shirt.  
8. **LABEL:** "IndigoAjrakhShirt" – **DESCRIPTION:** Indigo Ajrakh block-printed cotton shirt with mandarin collar, tailored fit – heritage craft fusion shirt.  
9. **LABEL:** "SageResortShirt" – **DESCRIPTION:** Sage viscose resort shirt with camp collar and soft drape – humidity-friendly evening top.  
10. **LABEL:** "BlackLinenShirt" – **DESCRIPTION:** Black linen shirt with mother-of-pearl buttons, relaxed fit – sleek coastal dinner shirt.  
11. **LABEL:** "EcruPiquePolo" – **DESCRIPTION:** Ecru moisture-wicking pique polo, tailored fit – polished casual top for daytime errands.  
12. **LABEL:** "NavyBreathableTee" – **DESCRIPTION:** Navy lightweight performance tee with mesh underarm panels, athletic fit – sweat-safe base layer.  
13. **LABEL:** "MaroonBanarasiBandi" – **DESCRIPTION:** Maroon Banarasi brocade Nehru jacket/bandi with antique gold zari buti – wedding-guest hero layer.  
14. **LABEL:** "IvoryKotaBandi" – **DESCRIPTION:** Ivory Kota-doria bandi with faint checks and ultra-light construction – humidity-proof festive layering.  
15. **LABEL:** "TealMatkaSilkBandi" – **DESCRIPTION:** Teal matka-silk bandi with tonal slubs, mandarin collar – rich yet breathable festive layer.  
16. **LABEL:** "MidnightUnlinedBlazer" – **DESCRIPTION:** Midnight navy unlined blazer in linen-cotton blend, soft shoulders – coastal formal layer without overheating.  
17. **LABEL:** "StoneLinenOvershirt" – **DESCRIPTION:** Stone beige linen overshirt with flap pockets and coconut buttons – relaxed layering for breezy nights.  
18. **LABEL:** "OliveTravelShacket" – **DESCRIPTION:** Olive lightweight cotton shacket with snap buttons – practical layer for airport-to-event transitions.

19. **LABEL:** "IvoryKurtaPajamaSet" – **DESCRIPTION:** Ivory cotton-silk kurta with matching drawstring pajama – **complete outfit**, classic day-function look.  
20. **LABEL:** "MintKurtaChuridarSet" – **DESCRIPTION:** Mint kurta with matching slim churidar, minimal zari piping – **complete outfit**, clean sangeet silhouette.  
21. **LABEL:** "BlackPathaniSet" – **DESCRIPTION:** Black Pathani kurta with matching salwar-style bottom – **complete outfit**, sharp night function wear.  
22. **LABEL:** "PowderBlueLinenSuitSet" – **DESCRIPTION:** Powder blue linen suit with unstructured blazer and matching trousers – **complete outfit**, beach-wedding formal.  
23. **LABEL:** "SandLinenSuitSet" – **DESCRIPTION:** Sand beige linen suit with relaxed tailoring and matching trousers – **complete outfit**, sunset cocktail-ready.  
24. **LABEL:** "NavyJodhpuriSuitSet" – **DESCRIPTION:** Navy Jodhpuri suit with structured jacket and matching trousers, contrast pocket square – **complete outfit**, regal Indo-western.  
25. **LABEL:** "IvorySherwaniSetLight" – **DESCRIPTION:** Ivory lightweight silk-blend sherwani with tonal embroidery and matching churidar – **complete outfit**, destination-wedding groom/groomsman option.  
26. **LABEL:** "BottleGreenKurtaDhotiSet" – **DESCRIPTION:** Bottle green kurta with pre-stitched silk-blend dhoti included, minimal border – **complete outfit**, modern festive fusion.  
27. **LABEL:** "WhiteKurtaDhotiSet" – **DESCRIPTION:** White cotton kurta with matching pre-stitched dhoti – **complete outfit**, classic pheras/pooja coastal look.  
28. **LABEL:** "CharcoalTuxedoSet" – **DESCRIPTION:** Charcoal tuxedo with satin lapel and matching trousers – **complete outfit**, after-party and club night.

29. **LABEL:** "OffWhitePajama" – **DESCRIPTION:** Off-white soft cotton pajama trousers, drawstring waist – universal ethnic bottom for kurtas.  
30. **LABEL:** "IvoryChuridar" – **DESCRIPTION:** Ivory stretch churidar with narrow ankle – streamlined kurta bottom.  
31. **LABEL:** "BlackChuridar" – **DESCRIPTION:** Black stretch churidar, smooth finish – sleek base for bright kurtas and bandis.  
32. **LABEL:** "WhiteLinenTrousers" – **DESCRIPTION:** White linen straight trousers, relaxed seat – coastal breathable bottom for shirts/kurtas.  
33. **LABEL:** "StoneCottonChinos" – **DESCRIPTION:** Stone beige lightweight chinos, slim taper – smart-casual bottom for resort shirts.  
34. **LABEL:** "OliveChinos" – **DESCRIPTION:** Olive breathable twill chinos, slim taper – versatile fusion bottom.  
35. **LABEL:** "NavyTailoredTrousers" – **DESCRIPTION:** Navy high-twist tailored trousers, ankle length – polished base for blazers and bandis.  
36. **LABEL:** "CharcoalPleatedTrousers" – **DESCRIPTION:** Charcoal airy tropical-wool blend pleated trousers – formal bottom that handles humidity better than heavy wool.  
37. **LABEL:** "BeigeLinenPleatPants" – **DESCRIPTION:** Beige linen pleated trousers, straight leg – effortless destination-wedding tailoring bottom.  
38. **LABEL:** "BlackSlimJeans" – **DESCRIPTION:** Black slim-fit jeans, clean wash – night-out fusion bottom.  
39. **LABEL:** "DarkIndigoJeans" – **DESCRIPTION:** Dark indigo straight jeans, minimal fading – dressier denim for travel days.  
40. **LABEL:** "NavySilkDhotiBottom" – **DESCRIPTION:** Navy pre-stitched silk-blend dhoti with crisp pleats – statement festive bottom for fusion looks.  
41. **LABEL:** "IvorySilkDhotiBottom" – **DESCRIPTION:** Ivory pre-stitched silk dhoti with subtle sheen, adjustable waist – elevated traditional bottom.  
42. **LABEL:** "SandTailoredShorts" – **DESCRIPTION:** Sand tailored cotton-linen shorts, above-knee, clean front – daytime poolside brunch bottom.  
43. **LABEL:** "WhiteDrawstringShorts" – **DESCRIPTION:** White cotton drawstring shorts, above-knee – casual pre-function comfort bottom.  
44. **LABEL:** "GreyTravelJoggers" – **DESCRIPTION:** Grey quick-dry travel joggers with zip pockets, tapered cuff – practical airport/late-night comfort bottom.
"""

WARDROBE_DESCRIPTIONS = "".join([s for s in WARDROBE_DESCRIPTIONS.splitlines(True) if s.strip("\r\n")])

def generate_dataset():
    # Load your generated batch of outfits
    with open('../batch-1-de.json', 'r', encoding='utf-8') as f:
        outfits = json.load(f)

    rejected_pairs_history = []
    output_filename = 'outfit_finetune_dataset_v25.jsonl'
    
    with open(output_filename, 'w', encoding='utf-8') as outfile:
        for outfit in outfits:
            # Format the rejected list for the prompt
            if not rejected_pairs_history:
                rejected_data_str = "(none)"
            else:
                # Formats as a bulleted list: "- TopLabel + BottomLabel"
                rejected_data_str = "\n".join([f"- {pair}" for pair in rejected_pairs_history])

            # Inject the variables into the prompt
            user_prompt = PROMPT_TEMPLATE.format(
                api_temp=27,
                api_condition="humid sea breeze and partly cloudy (Goa – destination wedding weekend, late November).",
                wardrobe_data=WARDROBE_DESCRIPTIONS,
                rejected_data=rejected_data_str
            )

            # The target output is the perfect JSON string of the current outfit
            agent_target = json.dumps(outfit, ensure_ascii=False)

            # Create the training record
            record = {
                "user": user_prompt,
                "agent": agent_target
            }

            # Write to JSONL
            outfile.write(json.dumps(record, ensure_ascii=False) + '\n')

            # --- CRITICAL STEP ---
            # Add the current outfit to the rejected history for the NEXT loop iteration
            new_rejected_pair = f"{outfit['top_label']} + {outfit['bottom_label']}"
            rejected_pairs_history.append(new_rejected_pair)

    print(f"Success! Generated {len(outfits)} training pairs and saved to {output_filename}")

if __name__ == "__main__":
    generate_dataset()