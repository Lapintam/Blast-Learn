import { Button } from "@/components/ui/button";
import {
  BrainCogIcon,
  EyeIcon,
  GlobeIcon,
  MonitorSmartphoneIcon,
  ServerCogIcon,
  ZapIcon,
  Brain,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const features = [
  {
    name: "Stave off Forgetting",
    description: "Cutting edge neuroscience suggests that asking yourself about and testing yourself on the data leads to a rapid increase in recollection",
    icon: Brain
  },
  {
    name: "Remember material in record time",
    description: "Users have reported a 56% reduction in time to memorize the information of their important documents",
    icon: ZapIcon ,
  },
  {
    name: "Chat Memorization",
    description: "Our intelligent software remembers previous interactions, providing a continuous iterative learning environment.",
    icon: BrainCogIcon ,
  },
  {
    name: "Interactive Experience",
    description: "Engage with Documents through multiple choice and open ended tests, proven to help you retain information more efficiently.",
    icon: EyeIcon,
  },
  {
    name: "Cloud Backup",
    description: "Rest assured knowing your documents are safely backed up on the cloud, protected from loss or damage.",
    icon: ServerCogIcon,
  },
  {
    name: "Responsive Across Devices",
    description: "Access and chat with your Documents seamlessly on any device, whether it's your desktop, tablet, or smartphone.",
    icon: MonitorSmartphoneIcon,
  },
];

export default function Home() {
  return (
    <main className="flex-1 overflow-scroll p-2 lg:p-5 bg-gradient-to-bl from-white to-[#6092C6]">
      <div className="bg-white py-24 sm:py-32 rounded-md drop-shadow-xl">
        <div className="flex flex-col justify-center items-center mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-base font-semibold leading-7 text-[#6092C6]">
              The Worlds Best Tutor
            </h2>

            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Transform Your Files into Interactive Learning Experiences
            </p>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              <span className="text-3xl">Introducing. . . {" "}</span>
              <span className="font-bold text-3xl">Blast <span className="text-[#6092C6]">Learn</span></span>
              <br />
              <br /> Upload your document, and allow our AI-enabled tutor help you retain information in 56% less time (cite),
              backed by cutting edge neuroscience(citation). Ideal for everyone, 
              <span className="text-[#6092C6]"> Blast Learn</span>{" "}
              converts important documents into{" "}
              <span className="font-bold">your cold hard memory</span>,
              making you the smartest person around, with our proven <span className="font-bold">8 step learning method.</span>
            </p>
          </div>
          <Button asChild className="mt-10 text-white text-xl rounded-full px-8 py-4">
            <Link href='/dashboard'>Get Started</Link>
          </Button>
        </div>
        <div className="relative overflow-hidden pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <Image
              alt="App screenshot"
              src="https://i.imgur.com/VciRSTI.jpeg"
              width={2432}
              height={1442}
              className="mb-[-0%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            />
            <div aria-hidden="true" className="relative">
              <div className="absolute bottom-0 -inset-x-32 bg-gradient-to-t from-white/95 pt-[5%]"/>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24">
          <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10
          text-base leading-7 text-gray-600 sm:grid-cols-2 lg-mx-0 
          lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <feature.icon
                    aria-hidden="true"
                    className="absolute left-1 top-1 h-5 w-5
                    text-[#6092C6]"
                  />
                </dt>

                <dd>{feature.description}</dd>
                
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  );
}

// Sources
// https://psycnet.apa.org/buy/1990-06057-001
// https://www.sciencedirect.com/science/article/abs/pii/S8755722317301047?via%3Dihub
// https://journals.sagepub.com/doi/10.1111/j.1745-6916.2006.00012.x?url_ver=Z39.88-2003&rfr_id=ori:rid:crossref.org&rfr_dat=cr_pub%20%200pubmed
// https://www.lifescied.org/doi/full/10.1187/cbe.14-11-0208
