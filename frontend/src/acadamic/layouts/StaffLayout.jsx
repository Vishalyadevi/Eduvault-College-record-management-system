import React from "react";
// import StaffSidebar from "../components/Sidebar/StaffSidebar";
import { Outlet } from "react-router-dom";
import Sidebar from "../../records/components/Sidebar";

const StaffLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="ml-64 flex-1 min-h-screen p-8">
        <div className="max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default StaffLayout;
