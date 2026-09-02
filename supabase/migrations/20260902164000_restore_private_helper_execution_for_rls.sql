-- RLS policies invoke private helper functions as the requesting API role.
-- Grant schema usage/function execution only for the helper functions that are intentionally used by policies and the registration wrapper.
GRANT USAGE ON SCHEMA private TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.get_current_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION private.create_registration_order(text,text,text,uuid,text) TO anon, authenticated;
