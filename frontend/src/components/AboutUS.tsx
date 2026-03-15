import React from 'react';

const OrangeTickIcon = () => (
  <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center mt-1">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M20.285 6.709a1 1 0 0 0-1.414-1.418l-9.19 9.205-4.548-4.548a1 1 0 1 0-1.414 1.414l5.255 5.255a1 1 0 0 0 1.414 0l9.897-9.908z" />
    </svg>
  </div>
);

const About1 = () => {
  // Common heading style for all main headings
  const headingStyle = {
    fontFamily: "'Georgia', 'Times', serif",
    fontWeight: 400,
    fontSize: "2.5rem",
    lineHeight: "1.2em",
    color: "darkblue",
    margin: "0 0 20px 0",
    padding: 0,
    textTransform: "uppercase",
    letterSpacing: "-0.5px"
  };

  return (
    <div className="w-full" style={{
      border: "0px",
      margin: "0px",
      outline: "0px",
      padding: "0px",
      fontStyle: "inherit",
      verticalAlign: "baseline",
      boxSizing: "border-box",
      fontFamily: "Roboto, sans-serif",
      fontWeight: 400,
      color: "#76767f",
      backgroundColor: "#f6f7fd",
      backgroundImage: "none",
      position: "relative"
    }}>
      {/* Background Section */}
      <div className="relative w-full h-[300px] md:h-[260px] overflow-hidden">
        <img
          src="/images/13.jpg"
          alt="NEC Campus"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-blue-900 bg-opacity-60 flex items-center justify-center">
          <h1 style={{
            ...headingStyle,
            color: "white",
            fontFamily: "'Georgia', 'Times', serif",
            fontSize: "3rem",
            textAlign: "center"
          }}>
            ABOUT US
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <section className="bg-gradient-to-b from-[#f3f9fb] to-white py-16 px-6 md:px-20">
        {/* College Info */}
        <div className="md:flex md:space-x-12 items-start mb-16">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <div className="border-l-4 border-[#1a237e] pl-4">
              <h2 style={headingStyle}>
                NATIONAL<br />ENGINEERING<br />COLLEGE
              </h2>
            </div>
          </div>

          <div className="md:w-1/2 text-justify text-gray-800 text-[17px] leading-relaxed">
            NEC, the most prominent landmark of Kovilpatti, has been the crowning glory of this Matchless City of Matches. 
            Its celebrated 'Son of the Soil' Thiru.K.Ramasamy transformed the entire social and cultural scenario in and around this small town by establishing the excellent educational institution popularly referred as "NEC". 
            By wielding the magical wand of social commitment and munificence this foresighted philanthropist transformed a strip of barren land into a magnificent academic complex that has been consistently producing infallible engineers of high competence right from the day of its inception in 1984. 
            This much-acclaimed temple of erudition was established under the self-financing scheme sanctioned by the Government of Tamilnadu G.O. No. 939 dated 20.07.1984 by the National Educational and Charitable Trust, Kovilpatti, Thoothukudi district
          </div>
        </div>

        {/* Vision & Mission */}
        <div className="mb-14">
          <h3 style={headingStyle}>
            VISION OF THE INSTITUTION
          </h3>
          <p className="text-gray-800 text-[17px] mb-5">
            Transforming lives through quality education and research with human values.
          </p>

          <h3 style={headingStyle}>
            MISSION
          </h3>
          <ul className="space-y-4 text-gray-800 text-[17px]">
            <li className="flex items-start gap-3">
              <OrangeTickIcon />
              <span>To maintain excellent infrastructure and highly qualified and dedicated faculty.</span>
            </li>
            <li className="flex items-start gap-3">
              <OrangeTickIcon />
              <span>To provide a conducive environment with an ambiance of humanity, wisdom, creativity, and team spirit.</span>
            </li>
            <li className="flex items-start gap-3">
              <OrangeTickIcon />
              <span>To promote the values of ethical behavior and commitment to the society.</span>
            </li>
            <li className="flex items-start gap-3">
              <OrangeTickIcon />
              <span>To partner with academic, industrial, and government entities to attain collaborative research.</span>
            </li>
          </ul>
        </div>

        {/* Founder's Message Section */}
        <section className="flex flex-col md:flex-row items-start justify-between px-6 py-12 gap-10 bg-gradient-to-br from-white via-blue-100 to-blue-200">
          <div className="max-w-7xl mx-auto py-10 flex flex-col md:flex-row gap-10">
            {/* Image */}
            <div className="flex-shrink-0">
              <img
                src="https://nec.edu.in/wp-content/uploads/2025/02/founder510x480.webp"
                alt="Founder"
                className="rounded-lg w-full md:w-[400px] object-cover"
              />
            </div>

            {/* Message */}
            <div className="text-gray-900">
              <h3 style={headingStyle}>
                FOUNDER'S MESSAGE —
              </h3>
              <div className="space-y-7 text-justify leading-relaxed">
   <p className="flex items-start gap-3">            
  <OrangeTickIcon />
  <span className="text-base" style={{ textAlign: 'justify' }}>
  Education is supporting the development of any country. National<br></br>
    Engineering College has dedicated itself to impart knowledge and <br></br>develop
    the students to be a responsible engineer, oblige a person<br></br>to the
    society and superior citizen to our nation.Students of our institution<br></br>
    are carved carefully by the qualities of hard work, <br></br>discipline and
    ethical practices in the profession.
  </span>
</p>

                <p className="flex items-start gap-3">
                  <OrangeTickIcon />
                  <span className="text-justify">
                    Our institution makes the students as an equipped professional with an ever open and fresh mind
                    for new thoughts in technological improvements. We are in the progress of harvesting the confidence
                    of the students which will emerge as valuable contributory assets to the development of the nation
                  </span>
                </p>
              </div>
              <p className="text-right mt-6 font-bold italic text-blue-800">
                – Thiru.K.Ramasamy
              </p>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-400 mt-8 w-full"></div>
      </section>
    </div>
  );
};

export default About1;