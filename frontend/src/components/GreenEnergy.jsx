import React from "react";
import { FaLeaf, FaTree, FaFire } from "react-icons/fa"; // Icons added
import Footer from "./Footer"
import "./GreenEnergy.css";

const GreenEnergy = () => {
  return (
    <div className="green-energy-container">
      <img
        src="https://nec.edu.in/wp-content/uploads/2025/01/2401312125000003-1300386381676583795-287.27746418110746-e1736488636401-1024x942.jpg"
        alt="Green Energy"
        className="background-image" style={{ height: "500px", objectFit: "cover" }}
      />
      <div className="overlay">
        <h1>GREEN ENERGY AT NEC</h1>
      </div>

      <div className="about-vision-container">
        <div className="content-box">
          <h2 className="heading">About</h2>
          <p className="text">
            Research and Development @ NEC is carried out in several areas like Computation, Energy, Environment, 
            Image Processing, Materials, Manufacturing, Nanotechnology, Telecommunication, and Sensor Networks.
          </p>
          <div className="vision-box">
            <h3 className="vision-heading">VISION</h3>
            <p className="vision-text">
              "To converge knowledge, intellectuals, and resources for technological innovations."
            </p>
          </div>
        </div>
      </div>

      {/* Environmental Benefits Section */}
      <div className="environmental-benefits">
        <h2 className="environmental-title">Environmental Benefits Earned</h2>
        <div className="stats-container">
          <div className="stats-box ">
            <FaLeaf className="stats-icon " />
            <h3 className="stats-title">CO2 Reduction</h3>
            <p className="stats-value">758 Ton</p>
          </div>
          <div className="stats-box">
            <FaTree className="stats-icon" />
            <h3 className="stats-title">Equivalent Planting of Trees</h3>
            <p className="stats-value">38,772</p>
          </div>
          <div className="stats-box">
            <FaFire className="stats-icon" />
            <h3 className="stats-title">Standard Coal Saved</h3>
            <p className="stats-value">295 Ton</p>
          </div>
        </div>
      </div>

      {/* Image Box Section */}
      
      <div className="w-[1050px] h-[500px] bg-white mx-auto">
  <img
    src="https://nec.edu.in/wp-content/uploads/2025/01/solar.jpg"
    alt="Solar Panels"
    className="w-full h-full object-cover"
  />
</div>
<br></br>
<br></br>
<div className="w-[1050px] h-[500px] bg-white mx-auto">
  <img
    src="https://nec.edu.in/wp-content/uploads/2025/01/2401312125000003-1300386381676583795-345.52256875532555-e1736488785560-1536x1378.jpg"
    alt="Solar Panels"
    className="w-full h-full object-cover"
  />
</div>
<br></br>
<br></br>
<div className="w-[1050px] h-[500px] bg-white mx-auto">
  <img
    src="https://nec.edu.in/wp-content/uploads/2025/01/2401312125000003-1300386381676583795-210.76019022450015.jpg"
    alt="Solar Panels"
    className="w-full h-full object-cover"
  />
</div>
<br></br>
<br></br>
      <Footer/>
  </div>
  );
};

export default GreenEnergy;
