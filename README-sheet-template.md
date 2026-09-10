# Buko Juan POS sheet template

Use these headers in the Google Sheet tabs to match the app script and the Excel copy.

## Sales
Date | Time | Receipt # | Total | Discount | Items String

## Expenses
Date | Description | Category | Amount | Notes

## Shifts
Date | Opening Cash | Expected | Actual | Variance

## Inventory
Item Name | Type | Current Stock Level

## Notes
- The app script creates or repairs the headers automatically when a POST arrives.
- The workbook should keep the same tab names exactly as above.
- Inventory is rewritten as a snapshot, so it is safe to clear and refresh.
