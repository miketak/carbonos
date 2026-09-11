-- Gives the step tables of a QA procedure fixed column widths.
--
-- A case is a pipe table with the columns Step, Action, Expected result,
-- Pass/Fail and Notes. Pandoc would share the width equally between them, so
-- the step number would get as much room as the expected result. This filter
-- recognises the header and sets the relative widths; the DOCX writer turns
-- them into a full-width table with a proportional grid.
--
-- Tables with any other header are left alone.

local HEADER = { "Step", "Action", "Expected result", "Pass/Fail", "Notes" }
local WIDTHS = { 0.04, 0.26, 0.30, 0.08, 0.32 }

local function is_step_table(tbl)
  local rows = tbl.head.rows
  if #rows ~= 1 or #rows[1].cells ~= #HEADER then
    return false
  end
  for i, name in ipairs(HEADER) do
    if pandoc.utils.stringify(rows[1].cells[i].contents) ~= name then
      return false
    end
  end
  return true
end

function Table(tbl)
  if not is_step_table(tbl) then
    return nil
  end
  local colspecs = {}
  for i, spec in ipairs(tbl.colspecs) do
    colspecs[i] = { spec[1], WIDTHS[i] }
  end
  tbl.colspecs = colspecs
  return tbl
end
