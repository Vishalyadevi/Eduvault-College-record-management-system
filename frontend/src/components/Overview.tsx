import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCube, Autoplay, Navigation, Pagination } from 'swiper/modules';
import { Target } from 'lucide-react';

import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const Overview = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="mb-16 text-center"
      >
        <motion.h1
          className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
          variants={itemVariants}
        >
          Placement Centre
        </motion.h1>
          <motion.div
            className="mx-auto"

          variants={itemVariants}
        >
          <motion.p
            className="text-lg text-gray-700 leading-relaxed text-justify h-full"
          >
            Welcome to Placement program of National Engineering College. This program consists of a dedicated and efficient placement team of students and staff who function round the year to ensure that students are placed in reputed companies across the country. Continuous placement training is offered to equip the students on communication, soft skills, confidence building, interview skills and test of reasoning by experts in the respective fields. Career development programs are regularly conducted through accomplished resource persons across a broad spectrum of industries. The Placement Centre strives to achieve 100% placements year on year. The students are also motivated and equipped to participate in the Campus placement programs. Renowned companies with attractive salary packages are invited to the campus recruitment drive. Companies which are part of on-campus placements are from Software and Core Engineering industry.
          </motion.p>
        </motion.div>
      </motion.div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          variants={containerVariants}
          className="lg:w-1/2 bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <Target className="text-blue-600" />
            Functions of Placement Centre
          </h2>

          <div className="space-y-4">
            {[
              "Organize On / Off campus Interviews for final year students",
              "Promote Industry Institute Interface activities",
              "Arrange Career / Personal Counselling sessions",
              "Organize Career Guidance sessions and Personality development programs",
              "Organize Functional Skill Development Program",
              "Conduct Placement training Programs"
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, x: -50 },
                  visible: { opacity: 1, x: 0, transition: { delay: index * 0.1 } }
                }}
                className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg hover:shadow-md transition-all duration-300"
              >
                <div className="h-2 w-2 rounded-full bg-blue-600" />
                <p className="text-gray-700">{item}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="lg:w-1/2"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Swiper
            effect="cube"
            grabCursor={true}
            cubeEffect={{
              shadow: true,
              slideShadows: true,
              shadowOffset: 20,
              shadowScale: 0.94,
            }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            pagination={{
              clickable: true,
            }}
            navigation={false}
            modules={[EffectCube, Autoplay, Navigation, Pagination]}
            className="w-full aspect-square max-w-xl mx-auto"
          >
            {[
              "https://nec.edu.in/wp-content/uploads/2024/05/IMG20240326094823-scaled.jpg",
              "https://nec.edu.in/wp-content/uploads/2024/05/IMG_5210-scaled.jpg",
              "https://nec.edu.in/wp-content/uploads/2024/05/IMG20240326094823-scaled.jpg"
            ].map((url, index) => (
              <SwiperSlide key={index}>
                <img
                  src={url}
                  alt={`Placement Event ${index + 1}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-16 text-center"
      >
        <h2 className="text-3xl font-bold mb-8 flex items-center justify-center gap-3">
          Companies Visited
        </h2>
        <div className="flex justify-center gap-4">
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Flogos-world.net%2Fwp-content%2Fuploads%2F2020%2F09%2FMicrosoft-Logo-2012-present.jpg&f=1&nofb=1" alt="Microsoft" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fhdqwalls.com%2Fwallpapers%2Famazon-4k-logo-qhd.jpg&f=1&nofb=1" alt="Amazon" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.AfKMLf4rKX7EqOSAVpujIQHaEK%26pid%3DApi&f=1" alt="Google" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.5ghidMJV9MiyatcrVV-OMgHaHa%26pid%3DApi%26h%3D160&f=1" alt="Oracle" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.DeId6RpwM-avm_kPulWfrAHaEK%26pid%3DApi%26h%3D160&f=1" alt="Adobe" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.h71yObz05sO13XXrZDDVPwHaEK%26pid%3DApi%26h%3D160&f=1" alt="Salesforce" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fstatic.vecteezy.com%2Fsystem%2Fresources%2Fpreviews%2F024%2F806%2F527%2Flarge_2x%2Finfosys-logo-transparent-free-png.png&f=1&nofb=1" alt="Infosys" className="h-16" />
          <img src="https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Ftse1.mm.bing.net%2Fth%3Fid%3DOIP.lOkT7ikqI2NPAIBN776_7AHaEK%26pid%3DApi%26h%3D160&f=1" alt="TCS" className="h-16" />
        </div>
      </motion.div>
    </div>
  );
};

export default Overview;
