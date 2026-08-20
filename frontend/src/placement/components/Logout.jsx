import { useAuth } from "../../records/pages/auth/AuthContext";

const LogoutButton = ({ className }) => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <button className={className} onClick={handleLogout}>
      Logout
    </button>
  );
};

export default LogoutButton;