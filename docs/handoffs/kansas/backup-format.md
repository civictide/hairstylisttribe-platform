# Backup file format ("Back up my work", Kansas workspace)

The file is named `Kansas-Cosmetology-backup-YYYY-MM-DD.json`:

```json
{
  "app": "ks-cosmetology-workspace",
  "v": 1,
  "saved": "2026-10-02T21:10:00.000Z",
  "source": "KansasTargets31k_line_types.csv (31,958 rows)",
  "summary": { "worked": 12, "contacted": 9, "responded": 2, "...": 0 },
  "leads": [ { "row": 1, "name": "…", "status": "Interested", "history": ["…"], "...": "readable copy, ignore for import" } ],
  "ops": {
    "K1": {
      "s": 5, "pr": 0, "f": "2026-10-05", "fs": true,
      "tags": ["Salon owner"],
      "sq": { "i": 0, "st": "2026-10-02", "nx": "text", "done": "" },
      "qn": "Quick note", "n": "Detailed notes", "op": "Opportunity",
      "ed": { "name": "", "phone": "", "email": "" },
      "rv": "2026-10-02T21:04:00.000Z",
      "u":  "2026-10-02T21:06:00.000Z",
      "log": [
        { "id": "x1", "t": "2026-10-02T21:05:00.000Z", "ch": "text", "dir": "in",  "out": "Interested", "x": "" },
        { "id": "x2", "t": "2026-10-02T21:05:00.000Z", "ch": "sys",  "k": "status", "sv": 5, "x": "Status: Interested" },
        { "id": "x3", "t": "2026-10-02T21:04:00.000Z", "ch": "note", "dir": "out", "out": "", "x": "Asked about booking software" },
        { "id": "x4", "t": "2026-10-02T21:03:00.000Z", "ch": "text", "dir": "out", "out": "", "x": "", "tpl": "B" }
      ]
    }
  },
  "meta": { "views": [], "settings": { "tpls": [{"id":"A","name":"Version A","text":"Hi {first_name}, this is Ovi."}], "tplMode": "A", "seq": {"on": true, "steps": [{"d":0,"ch":"text"},{"d":3,"ch":"text"},{"d":7,"ch":"call"},{"d":14,"ch":"email"}]}, "target": 75, "quietDays": 5, "tagList": ["Salon owner"], "auto": true, "skipShared": true } }
}
```

**Import from `ops`.** Its keys are `lead_id` values (`K` followed by `column_1`).

| Backup field | Goes to |
|---|---|
| `s` | `ks_ops.status` |
| `pr` | `ks_ops.priority` |
| `f`, `fs` | `ks_ops.follow_up` (empty string = null) and whether the sequence set it |
| `tags` | `ks_tags` |
| `sq` | sequence state: step index `i`, start date `st`, next channel `nx`, `done` = '' / 'replied' / 'finished' |
| `qn`, `n`, `op` | `ks_ops.quick_note`, `notes`, `opportunity` |
| `rv`, `u` | `ks_ops.reviewed_at`, `updated_at` |
| `ed` | `ks_edits` (only when a field is non-empty) |
| `log[]` | `ks_activity`: `t`→`at`, `ch`→`channel`, `dir`→`direction`, `out`→`outcome`, `x`→`details`, `tpl`→`message_version`; for `ch='sys'` also `k`→`kind` and `sv`→`status_value` |
| `meta.settings`, `meta.views` | `ks_user_state` |
