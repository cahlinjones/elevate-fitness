#!/usr/bin/env python3
"""
Wix CSV to JSON Converter for Elevate Fitness Migration
This script converts Wix CSV exports into JSON format for customer import
"""

import csv
import json
import sys
from datetime import datetime

def convert_csv_to_json(customers_csv, subscriptions_csv=None, orders_csv=None, output_file='customers.json'):
    """
    Convert Wix CSV files to JSON format for import
    
    Args:
        customers_csv: Path to customers CSV file
        subscriptions_csv: Path to subscriptions CSV file (optional)
        orders_csv: Path to orders CSV file (optional)
        output_file: Output JSON file path
    """
    
    customers = {}
    
    # Read customers file
    print(f"Reading customers from {customers_csv}...")
    with open(customers_csv, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = row.get('Email', row.get('email', '')).strip().lower()
            if not email:
                continue
                
            customers[email] = {
                'email': email,
                'name': f"{row.get('First Name', '')} {row.get('Last Name', '')}".strip() or row.get('Name', ''),
                'phone': row.get('Phone', row.get('phone', '')),
                'wixId': row.get('ID', row.get('Contact ID', '')),
                'address': {
                    'line1': row.get('Street Address', row.get('Address', '')),
                    'city': row.get('City', ''),
                    'state': row.get('State', row.get('Region', '')),
                    'postal_code': row.get('Zip', row.get('Postal Code', '')),
                    'country': row.get('Country', 'US')
                },
                'subscription': None,
                'orderHistory': []
            }
    
    print(f"Loaded {len(customers)} customers")
    
    # Read subscriptions file if provided
    if subscriptions_csv:
        print(f"Reading subscriptions from {subscriptions_csv}...")
        with open(subscriptions_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = row.get('Email', row.get('Member Email', '')).strip().lower()
                if email in customers:
                    status = row.get('Status', '').lower()
                    if status == 'active':
                        customers[email]['subscription'] = {
                            'isActive': True,
                            'planName': row.get('Plan Name', row.get('Plan', 'Individual Membership')),
                            'startDate': row.get('Start Date', row.get('Created', '')),
                            'nextRenewalDate': row.get('Next Payment Date', row.get('Renewal Date', ''))
                        }
        print("Subscriptions loaded")
    
    # Read orders file if provided
    if orders_csv:
        print(f"Reading order history from {orders_csv}...")
        with open(orders_csv, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                email = row.get('Email', row.get('Customer Email', '')).strip().lower()
                if email in customers:
                    customers[email]['orderHistory'].append({
                        'date': row.get('Date', row.get('Order Date', '')),
                        'amount': row.get('Total', row.get('Amount', '0')),
                        'item': row.get('Items', row.get('Product', 'Purchase'))
                    })
        print("Order history loaded")
    
    # Convert to list and clean up
    customer_list = []
    for customer in customers.values():
        # Remove empty address if all fields are empty
        if not any(customer['address'].values()):
            del customer['address']
        
        # Remove subscription if None
        if not customer['subscription']:
            del customer['subscription']
        
        # Remove orderHistory if empty
        if not customer['orderHistory']:
            del customer['orderHistory']
        
        customer_list.append(customer)
    
    # Write to JSON file
    print(f"Writing to {output_file}...")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(customer_list, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Success! Created {output_file}")
    print(f"📊 Total customers: {len(customer_list)}")
    
    # Statistics
    with_subscriptions = sum(1 for c in customer_list if 'subscription' in c)
    with_orders = sum(1 for c in customer_list if 'orderHistory' in c)
    
    print(f"📈 With active subscriptions: {with_subscriptions}")
    print(f"📦 With order history: {with_orders}")
    print(f"\n💡 Next step: Upload {output_file} to admin-import.html")

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python3 wix_to_json.py <customers.csv> [subscriptions.csv] [orders.csv]")
        print("\nExample:")
        print("  python3 wix_to_json.py wix-customers.csv")
        print("  python3 wix_to_json.py wix-customers.csv wix-subscriptions.csv wix-orders.csv")
        sys.exit(1)
    
    customers_file = sys.argv[1]
    subscriptions_file = sys.argv[2] if len(sys.argv) > 2 else None
    orders_file = sys.argv[3] if len(sys.argv) > 3 else None
    
    try:
        convert_csv_to_json(customers_file, subscriptions_file, orders_file)
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        sys.exit(1)
