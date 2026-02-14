import { useLocation } from "react-router-dom";

const DashboardPlaceholder = () => {
  const { pathname } = useLocation();
  const name = pathname.split("/").pop() || "Page";
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="space-y-4">
      <h3>{title}</h3>
      <p className="text-muted-foreground">This page is under construction.</p>
    </div>
  );
};

export default DashboardPlaceholder;
