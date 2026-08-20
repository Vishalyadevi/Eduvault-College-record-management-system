import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { StudentProvider } from './records/contexts/StudentContext.jsx';
import { StaffProvider } from './records/contexts/StaffContext.jsx';
import { UserProvider } from './records/contexts/UserContext.jsx';
import { InternProvider } from "./records/contexts/InternContext";
import { DashboardProvider } from "./records/contexts/DashboardContext";
import { OrganizedEventProvider } from "./records/contexts/OrganizedEventContext";
import { AttendedEventProvider } from "./records/contexts/AttendedEventContext";
import { AppProvider } from './records/contexts/AppContext.jsx';
import { LocationProvider } from './records/contexts/LocationContext.jsx';
import { ScholarshipProvider } from './records/contexts/ScholarshipContext.jsx'
import { LeaveProvider } from './records/contexts/LeaveContext.jsx';
import { OnlineCoursesProvider } from './records/contexts/OnlineCoursesContext.jsx';
import { AchievementProvider } from "./records/contexts/AchievementContext.jsx";
import { StudentDataProvider } from './records/contexts/studentDataContext.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StudentDataProvider>
      <AchievementProvider>
        <OnlineCoursesProvider>
          <LeaveProvider>
            <OrganizedEventProvider>
              <ScholarshipProvider>
                <LocationProvider>
                  <AppProvider>
                    <AttendedEventProvider>

                      <InternProvider>
                        <DashboardProvider>
                          <UserProvider>
                            <StudentProvider>
                              <StaffProvider>
                                <BrowserRouter>
                                  <App />
                                </BrowserRouter>
                              </StaffProvider>
                            </StudentProvider>
                          </UserProvider>
                        </DashboardProvider>
                      </InternProvider>

                    </AttendedEventProvider>
                  </AppProvider>
                </LocationProvider>
              </ScholarshipProvider>
            </OrganizedEventProvider>
          </LeaveProvider>
        </OnlineCoursesProvider>
      </AchievementProvider>
    </StudentDataProvider>

  </StrictMode>
);
