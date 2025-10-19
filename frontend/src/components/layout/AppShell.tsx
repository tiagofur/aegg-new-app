import { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Building2, Home, LogOut, SquareKanban, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DashboardRole } from "../../types";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AppShellProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  fullWidth?: boolean;
  contentClassName?: string;
}

interface NavLinkItem {
  to: string;
  label: string;
  icon: typeof Home;
  roles?: DashboardRole[];
}

const navLinks: NavLinkItem[] = [
  { to: "/dashboard", label: "Inicio", icon: Home },
  { to: "/trabajos", label: "Trabajos", icon: SquareKanban },
  {
    to: "/clientes",
    label: "Clientes",
    icon: Building2,
    roles: ["Admin", "Gestor"],
  },
  {
    to: "/admin/users",
    label: "Usuarios",
    icon: Users,
    roles: ["Admin"],
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

export const AppShell = ({
  title,
  breadcrumbs,
  actions,
  children,
  fullWidth,
  contentClassName,
}: AppShellProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role;

  const availableLinks = navLinks.filter((link) => {
    if (!link.roles || link.roles.length === 0) {
      return true;
    }
    if (!role) {
      return false;
    }
    return link.roles.includes(role);
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white/90 backdrop-blur border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-10">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-600 transition-colors"
              >
                Aegg
              </button>
              <nav className="hidden md:flex items-center gap-1">
                {availableLinks.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname.startsWith(to);
                  return (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          (isActive || active) && "bg-blue-50 text-blue-600",
                          !(isActive || active) &&
                            "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {user && (
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-sm font-semibold leading-none">
                    {user.name}
                  </span>
                  <span className="text-xs text-slate-500">{user.email}</span>
                  <span className="text-xs font-medium text-blue-600">
                    Rol: {user.role}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="flex items-center justify-around px-2 py-2 text-sm">
            {availableLinks.map(({ to, label, icon: Icon }) => {
              const active = location.pathname.startsWith(to);
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-col items-center gap-1 rounded-md px-2 py-1",
                      (isActive || active) && "text-blue-600",
                      !(isActive || active) &&
                        "text-slate-500 hover:text-slate-900"
                    )
                  }
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </NavLink>
              );
            })}
          </nav>
        </div>
      </header>

      <main
        className={cn(
          "mx-auto w-full grow px-4 sm:px-6 lg:px-8 py-8",
          fullWidth ? "max-w-full" : "max-w-7xl",
          contentClassName
        )}
      >
        {(title || (breadcrumbs && breadcrumbs.length > 0) || actions) && (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {breadcrumbs && breadcrumbs.length > 0 && (
                <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                  {breadcrumbs.map((item, index) => (
                    <div
                      key={`${item.label}-${index}`}
                      className="flex items-center gap-2"
                    >
                      {item.to ? (
                        <button
                          type="button"
                          onClick={() => navigate(item.to!)}
                          className="hover:text-slate-900"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <span className="font-medium text-slate-700">
                          {item.label}
                        </span>
                      )}
                      {index < breadcrumbs.length - 1 && (
                        <span className="text-slate-300">/</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {title && (
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {title}
                </h1>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default AppShell;
