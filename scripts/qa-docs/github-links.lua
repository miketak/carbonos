-- Rewrites the relative links of a QA procedure so they work outside the repo.
--
-- Inside the repo a procedure links to its specs as ../../specs/NN.md and to
-- its siblings as 00N-name.md. In a Google Doc those paths are dead, so every
-- relative link becomes <repo_url>/blob/<git_ref>/<path resolved from the
-- repository root>. Absolute links and in-document anchors are left alone.
--
-- Metadata expected (passed with -M): repo_url, git_ref, source_path (the
-- Markdown file's path from the repository root, for example
-- docs/qa/001-access-and-roles.md).

local repo_url = ""
local git_ref = "main"
local source_dir = ""

local function stringify(value)
  return value and pandoc.utils.stringify(value) or nil
end

-- Joins a base directory and a relative path, collapsing "." and "..".
local function resolve(base, relative)
  local parts = {}
  local function push(segment)
    if segment == "" or segment == "." then
      return
    end
    if segment == ".." then
      table.remove(parts)
    else
      table.insert(parts, segment)
    end
  end
  for segment in base:gmatch("[^/]+") do
    push(segment)
  end
  for segment in relative:gmatch("[^/]+") do
    push(segment)
  end
  return table.concat(parts, "/")
end

local function is_absolute(target)
  return target:match("^%a[%w+.-]*:") ~= nil or target:sub(1, 1) == "/"
end

function Meta(meta)
  repo_url = stringify(meta.repo_url) or repo_url
  git_ref = stringify(meta.git_ref) or git_ref
  local source_path = stringify(meta.source_path) or ""
  source_dir = source_path:match("^(.*)/[^/]*$") or ""
end

function Link(link)
  local target = link.target
  if target == "" or target:sub(1, 1) == "#" or is_absolute(target) then
    return nil
  end
  local path, anchor = target:match("^([^#]*)(#?.*)$")
  link.target = repo_url .. "/blob/" .. git_ref .. "/" .. resolve(source_dir, path) .. anchor
  return link
end

-- Meta must run before Link: return the filters in that order.
return { { Meta = Meta }, { Link = Link } }
