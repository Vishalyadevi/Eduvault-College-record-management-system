import React from "react";
import './ScrollableTable.css';
import "./FeePaymentGuide.css";


const DeanSection = () => {
    const headingStyle = {
        fontFamily: "'Georgia', 'Times', serif",
        fontWeight: 400,
        fontSize: "1.2rem",
        lineHeight: "1.2em",
        color: "black",
        margin: "0 0 20px 0",
        padding: 0,
        textTransform: "uppercase",
        letterSpacing: "-0.5px",
        transition: "color 0.3s ease"
    };

    const teamMembers = [
        { name: "Dr.B.Paramasivam, Prof / AIS & DS", designation: "Dean" },
        { name: "Dr.S.Rajagopal, Asst. Prof (SG)/IT", designation: "Coordinator" },
        { name: "Dr. Vikramjeet, Asso. Prof / Civil", designation: "Coordinator" },
        { name: "Dr.R.Srinivasan, Doctor", designation: "External Member" },
        { name: "Dr.B.Saranya, Doctor", designation: "External Member" },
        { name: "Mrs.V.Vasanthalakshmi, Psychologist", designation: "External Member" },
    ];

    const studentAffairsMembers = [
        { name: "Mr.K.Thoufiq Mohammed", designation: "AP(SrG)/Mech" },
        { name: "Mr.I.Karthikeyan", designation: "AP/CSE" },
        { name: "Dr.S.Loganay", designation: "AP/ECE" },
        { name: "Dr.F.X.Edwin Deepak", designation: "AP/EEE" },
        { name: "Mr.K.Muthukrishnu", designation: "AP/Civil" },
        { name: "Mr.R.Prabhu", designation: "AP/MBA" },
        { name: "Dr.M.Prabhu", designation: "AP(SrG)/SH" },
    ];

    const industryRelationsMembers = [
        { name: "Dr.V.Bino Wincy", designation: "AP/Mech" },
        { name: "Dr.ShermilaJosephine", designation: "AP/CSE" },
        { name: "Dr.N.Arumugam", designation: "Asso. Prof. / ECE" },
        { name: "Ms.M. Balamaheswari", designation: "AP/IT" },
        { name: "Ms.K.Vinothini", designation: "Asso. Prof. / IT" },
        { name: "Dr.B.Rajkumar", designation: "AP/SH" },
    ];

    const deanImageUrl = "https://nec.edu.in/wp-content/uploads/2024/01/CSET001-it.jpg";

    return (
        <div className="fee-page-wrapper">
            {/* Banner */}
            <div className="fee-banner">
                <h1 className="fee-title">Student Affairs & Industrial Relations</h1>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
                {/* Image + Content Section */}
                <section className="flex flex-col md:flex-row gap-8 mb-12">
                    {/* Left Side - Image Card */}
                    <div className="w-full md:w-1/3 group">
                        <div className="bg-gray-100 shadow-[0_0_15px_3px_rgba(14,43,100,0.4)] p-6 flex flex-col items-center text-center transition-all duration-300 hover:bg-[#0e2b73] scale-105 h-85 w-95">
                            <div className="w-40 h-40 rounded-full overflow-hidden mb-4 border-white shadow-md">
                                <img
                                    src={deanImageUrl}
                                    alt="Dean Portrait"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.querySelector('.image-placeholder')!.classList.remove('hidden');
                                    }}
                                />
                                <div className="image-placeholder hidden h-full flex items-center justify-center">
                                    <span className="text-gray-400">Dean's Image</span>
                                </div>
                            </div>
                            <div className="p-6">
                                <h3 className="group-hover:text-white" style={headingStyle}>
                                    Dr.B.Paramasivam
                                </h3>
                                <p className="text-gray-600 text-center mt-2 group-hover:text-white">
                                    Dean (Student Affairs & Industrial Relations)
                                </p>
                                <br />
                                
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Content */}
                    <div className="w-full md:w-2/3">
                        <br />
                        <br />
                        <br />
                        <br/>
                        <br/>
                        <br/>
                        <h4 className="mb-5  text-[1.5rem] leading-[1.9] font-normal font-serif text-[darkblue] clear-both">
                            <strong className="font-bold">DEAN (STUDENT AFFAIRS & INDUSTRIAL RELATIONS)</strong>
                        </h4>
                       
                    </div>
                </section>

                {/* Team Members Table */}
                <section className="bg-white">
                    <div className="p-6">
                        <h3 className="mb-5  text-[2rem] leading-[1.5] font-normal font-serif text-[darkblue] clear-both">Team Members</h3>
                        <div className="table-wrapper">
                            <table className="custom-table">
                                <thead>
                                    <tr >
                                        <th>S.No</th>
                                        <th>Designation</th>
                                        <th>Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {teamMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{member.designation}</td>
                                            <td>{member.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Student Affairs Members Table */}
                <section className="bg-white">
                    <div className="p-6">
                        <h3 className="mb-5  text-[2rem] leading-[1.5] font-normal font-serif text-[darkblue] clear-both">Student Affairs Members</h3>
                        <div className="table-wrapper">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Designation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentAffairsMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{member.name}</td>
                                            <td>{member.designation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* Industry Relations Members Table */}
                <section className="bg-white">
                    <div className="p-6">
                        <h3 className="mb-5  text-[2rem] leading-[1.5] font-normal font-serif text-[darkblue] clear-both">Industry Relations Members</h3>
                        <div className="table-wrapper">
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Designation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {industryRelationsMembers.map((member, index) => (
                                        <tr key={index}>
                                            <td>{index + 1}</td>
                                            <td>{member.name}</td>
                                            <td>{member.designation}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DeanSection;
