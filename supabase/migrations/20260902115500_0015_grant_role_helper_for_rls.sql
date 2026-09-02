-- RLS policies call this private helper, so client roles need execute permission on the helper itself.
-- The helper returns only the role enum for auth.uid(); anonymous callers receive NULL.
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO anon, authenticated;
