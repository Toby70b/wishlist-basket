import json

VALID_PAYLOAD = {"steamid": "76561198000000001", "context": {"country_code": "GB"}, "page_size": 1000}
VALID_QUERY_PARAMS = {"input_json": json.dumps(VALID_PAYLOAD)}

WISHLIST_DISCOUNTED_ITEM = json.dumps({
    "response": {
        "items": [{
            "appid": 1244090,
            "priority": 5,
            "date_added": 1693430916,
            "store_item": {
                "item_type": 0,
                "id": 1244090,
                "success": 1,
                "visible": True,
                "name": "Sea of Stars: Sunset Edition",
                "store_url_path": "app/1244090/Sea_of_Stars_Sunset_Edition",
                "appid": 1244090,
                "type": 0,
                "best_purchase_option": {
                    "packageid": 431745,
                    "purchase_option_name": "Sea of Stars: Sunset Edition",
                    "final_price_in_cents": "1475",
                    "original_price_in_cents": "2950",
                    "formatted_final_price": "£14.75",
                    "formatted_original_price": "£29.50",
                    "discount_pct": 50,
                    "active_discounts": [{
                        "discount_amount": "1475",
                        "discount_description": "#discount_desc_preset_weeklong",
                        "discount_end_date": 1793642400,
                    }],
                },
            },
        }]
    }
}, ensure_ascii=False)

WISHLIST_COMING_SOON_ITEM = json.dumps({
    "response": {
        "items": [{
            "appid": 2649560,
            "priority": 159,
            "date_added": 1787507831,
            "store_item": {
                "item_type": 0,
                "id": 2649560,
                "success": 1,
                "visible": True,
                "name": "Persona 6",
                "store_url_path": "app/2649560/Persona_6",
                "appid": 2649560,
                "type": 0,
                "is_coming_soon": True,
            },
        }]
    }
})

WISHLIST_EMPTY = json.dumps({"response": {}})