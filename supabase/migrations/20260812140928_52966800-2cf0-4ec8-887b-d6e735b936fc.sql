CREATE TYPE public.app_role AS ENUM ('admin', 'employee');
CREATE TYPE public.user_status AS ENUM ('active', 'disabled');
CREATE TYPE public.voucher_account_kind AS ENUM ('aid', 'petty', 'other', 'none');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  status public.user_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "user_roles_select_own" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_admin_select" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial TEXT NOT NULL,
  amount_figures NUMERIC(14,2),
  amount_words TEXT,
  voucher_date DATE,
  date_day TEXT,
  date_month TEXT,
  date_year TEXT,
  receiver_name TEXT,
  account_kind public.voucher_account_kind NOT NULL DEFAULT 'none',
  account_other TEXT,
  reason TEXT,
  sign_receiver TEXT,
  sign_accountant TEXT,
  sign_manager TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX vouchers_created_by_idx ON public.vouchers (created_by);
CREATE INDEX vouchers_created_at_idx ON public.vouchers (created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vouchers TO authenticated;
GRANT ALL ON public.vouchers TO service_role;
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vouchers_select_own" ON public.vouchers
  FOR SELECT TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "vouchers_insert_own" ON public.vouchers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "vouchers_update_own" ON public.vouchers
  FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "vouchers_admin_all" ON public.vouchers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT,
  action TEXT NOT NULL,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  voucher_serial TEXT,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own" ON public.audit_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "audit_logs_insert_self" ON public.audit_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER vouchers_set_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();