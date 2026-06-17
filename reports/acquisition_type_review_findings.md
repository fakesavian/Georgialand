# LOOP 3 — Acquisition_Type Review Pass

## Findings Summary

**Current State:** 300 rows have blank/invalid Acquisition_Type with `suggested_needs_review` status for "Off-Market Research".

**Evidence:** ALL 300 rows have `Current_Status = "Off-Market"`, which is the primary row classification field.

**Recommendation:** Promote all 300 to `Acquisition_Type = "Off-Market Research"` (present).

---

## Before State

| Status | Count | Notes |
|--------|-------|-------|
| present | 58 | Rows with filled Acquisition_Type |
| auto_confident | 0 | N/A |
| suggested_needs_review | 300 | All suggest "Off-Market Research" |
| unknown_needs_research | 0 | N/A |
| **Total blanks** | **300** | All can be justified by source |

---

## After State (if promoted)

| Status | Count | Notes |
|--------|-------|-------|
| present | 358 | 58 existing + 300 promoted |
| auto_confident | 0 | N/A |
| suggested_needs_review | 0 | RESOLVED |
| unknown_needs_research | 0 | N/A |
| **Total blanks** | **0** | All rows populated |

---

## Promotion Justification

### Rule
```
WHERE Acquisition_Type IS BLANK OR "Needs verification"
  AND Current_Status = "Off-Market"
THEN Acquisition_Type = "Off-Market Research"
```

### Evidence Source
- **Field:** `Current_Status` (primary row classification)
- **Match:** 300 / 300 blank rows (100%)
- **Pattern:** Current_Status contains "Off-Market"

### Sample Citations (5 of 300)

1. **DEKALB-1**  
   - Current_Status: "Off-Market"  
   - Data_Source_Type: "GIS-Parcel"  
   - → Acquisition_Type: "Off-Market Research"

2. **DEKALB-2**  
   - Current_Status: "Off-Market"  
   - Data_Source_Type: "GIS-Parcel"  
   - → Acquisition_Type: "Off-Market Research"

3. **DEKALB-3**  
   - Current_Status: "Off-Market"  
   - Data_Source_Type: "GIS-Parcel"  
   - → Acquisition_Type: "Off-Market Research"

4. **DEKALB-4**  
   - Current_Status: "Off-Market"  
   - Data_Source_Type: "GIS-Parcel"  
   - → Acquisition_Type: "Off-Market Research"

5. **DEKALB-5**  
   - Current_Status: "Off-Market"  
   - Data_Source_Type: "GIS-Parcel"  
   - → Acquisition_Type: "Off-Market Research"

---

## Impact on Gold Dataset Readiness

### Expected Blockers Lift
- Rows currently blocked by `acquisition_type` blocker: ~30 (from `scoreRow()`)
- These will move from `not_ready` → `near_ready` once Acquisition_Type is present

### Overall Score Improvement
- Core identity dimension score will lift (Acquisition_Type is 1 of 8 core fields)
- Expected `overall` readiness score increase: +2–5 points per affected row

### Production CSV Impact
- **Source file untouched:** `public/local_dashboard_dataset.csv` remains as-is
- **Enriched output only:** `data/output/georgia_land_gold_enriched.csv` will reflect promotions after re-run

---

## Verification Criteria

- [x] Pattern match: 100% of 300 blank rows support "Off-Market Research"
- [x] Evidence cited: `Current_Status = "Off-Market"`
- [x] Source field verified: Primary row classification field
- [x] Production CSV untouched (awaiting user approval)

---

## Next Steps

To complete this loop:

1. **Approve** the promotion rule and evidence
2. **Apply** to source CSV (rows 2–357, Acquisition_Type column):
   ```bash
   # Manually update public/local_dashboard_dataset.csv
   # Set Acquisition_Type = "Off-Market Research" for all blank rows where Current_Status="Off-Market"
   ```
3. **Re-run** conversion:
   ```bash
   node scripts/convert-near-ready-to-gold.mjs
   ```
4. **Verify** results:
   - Check `reports/gold_conversion_summary.json` for `flippedToGold` count
   - Check `reports/gold_conversion_remaining_blockers.csv` for remaining `acquisition_type` blockers

---

**Report Generated:** 2026-06-17  
**Analysis Method:** Inference logic validation + source field cross-reference  
**Confidence:** 100% (all 300 blank rows have explicit Current_Status match)
