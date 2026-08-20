import React from "react";
import "./FeePaymentGuide.css"; // Your external CSS file

const FeePaymentGuide = () => {
  return (
    <div className="fee-page-wrapper">
      {/* Banner */}
      <div className="fee-banner">
        <h1 className="fee-title">FEE PAYMENT</h1>
      </div>

      {/* Main Content */}
      <div className="fee-content">
        <p>
          Students can use these guidelines to remit their fees to the college
          through online transactions using IOB pay as detailed below.
        </p>

        {/* Updated CTA */}
        <div className="fee-link-cta">
          <h5 className="fee-link-text">
            Click here for{" "}
            <a
              href="https://erp.nec.edu.in/onlinefee/"
              target="_blank"
              rel="noopener noreferrer"
              className="fee-link-anchor"
            >
              Online Fee Payment
            </a>
            <img
              src="https://nec.edu.in/wp-content/uploads/2025/02/newimg.png"
              alt="new"
              className="fee-link-icon"
            />
          </h5>
        </div>

        

        <h2 className="text-3xl font-bold text-blue-900 mb-10">Instructions to access the IOB pay for online fee payment</h2>
        <ol >
          <li>
            1. In our website,{" "}
            <a href="http://www.nec.edu.in" className="fee-link-anchor">www.nec.edu.in</a> home page, click
            the <strong>Online Fee Payment-ERP</strong> link that     &nbsp; &nbsp;&nbsp;&nbsp;&nbsp;appears in the
            upper right corner.
          </li>
          <li>
         2.Read the instructions carefully. Then, select{" "}
            <strong>Online Fee Payment NEW</strong> link and click it.
          </li>
          <li>
          3.Choose the following fields:
            
          <br />&nbsp;&nbsp;&nbsp;&nbsp;a. Enter your register/roll number in the below box.
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;b. Enter your date of birth as "DDMMYYYY" (Example:{" "}
            <span className="mono">13082002</span>) and submit.
          </li>
          <li>4.In the new window, click the "Pay Online" button.</li>
          <li>
          5.Select <strong>Indian Overseas Bank</strong>, then click the{" "}
            <strong>Make a Payment</strong> button for fee transaction.
          </li>
          <li>
          6.In the next confirmation window, choose any one of the following
            payment modes:
            <br/>
            &nbsp;&nbsp;&nbsp;&nbsp;a) <strong>IOB Net Banking</strong>
            <br />
            &nbsp;&nbsp;&nbsp;&nbsp;b) <strong>Any Bank Net Banking/Debit Cards/Credit Cards</strong>
          </li>
          <li>
          7.Select the <strong>Pay Now</strong> button to proceed with the payment.
          </li>
          <li>
            8.After a successful online payment, you can print the payment receipt.
          </li>
          <li>9.Finally, <strong>Logout</strong> of the window.</li>
        </ol>
      </div>
    </div>
  );
};

export default FeePaymentGuide;
