import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import NavBar from "@/components/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CalendarIcon,
  BriefcaseIcon,
  PenToolIcon,
  UsersIcon,
  ArrowLeftIcon,
} from "lucide-react";

const Dashboard = () => {
  const auth = getAuth();
  const navigate = useNavigate();

  // Keep authentication check to protect the dashboard
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Redirect to login page if user is not authenticated
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, [auth, navigate]);

  const cardOptions = [
    {
      title: "Date of Birth",
      abbreviation: "DOB",
      description: "Request for correction of date of birth",
      icon: <CalendarIcon className="h-6 w-6" />,
      route: "/DOBCorrectionForm",
    },
    {
      title: "Date of First Appointment",
      abbreviation: "DOFA",
      description: "Request for correction of first appointment date",
      icon: <BriefcaseIcon className="h-6 w-6" />,
      route: "/DOFACorrectionForm",
    },
    {
      title: "Change of Name",
      abbreviation: "CON",
      description: "Request for change of name",
      icon: <PenToolIcon className="h-6 w-6" />,
      route: "/NameChangeForm",
    },
    {
      title: "Restoration and Migration ",
      abbreviation: "",
      description:
        "Request Salary restoration and migration of salary paypoint",
      icon: <ArrowLeftIcon className="h-6 w-6" />,
      route: "/RestorationMigrationForm",
    },
    {
      title: "Change of Next of Kin",
      abbreviation: "NOK",
      description: "Request for change of next of kin information",
      icon: <UsersIcon className="h-6 w-6" />,
      route: "/NextOfKinForm",
    },
  ];

  return (
    <>
      <NavBar />
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Requests</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cardOptions.map((card, index) => (
            <Link to={card.route} key={index} className="block">
              <Card className="h-full transition-all hover:shadow-md hover:border-primary">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl">{card.title}</CardTitle>
                  <div className="p-2 bg-primary/10 rounded-full">
                    {card.icon}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {card.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="pt-0">
                  {card.abbreviation && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      {card.abbreviation}
                    </span>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
