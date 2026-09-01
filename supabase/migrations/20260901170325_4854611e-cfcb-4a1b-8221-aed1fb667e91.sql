UPDATE public.user_roles SET role = 'admin'::app_role WHERE user_id = 'e59dd559-46c0-4a0c-b2c1-ab82b6103079';
INSERT INTO public.audit_logs (user_id, username, action, details)
VALUES ('e59dd559-46c0-4a0c-b2c1-ab82b6103079', 'abdullah', 'user_role_changed', 'ترقية المستخدم عبدالله إلى مدير / مسؤول');