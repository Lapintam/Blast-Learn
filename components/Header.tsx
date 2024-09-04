import { SignedIn, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "./ui/button";
import { FilePlus2 } from "lucide-react";
import UpgradeButton from "./UpgradeButton";

export default function Header() {
  return (
    <div className="flex justify-between bg-white shadow-sm p-5 border-b">
        <Link href='/dashboard' className="text-2xl">
            Blast <span className="text-[#6092C6]">Learn</span>
        </Link>

        <SignedIn>
            <div className="flex items-center space-x-2">
                <Button asChild variant='link' className="text-[#6092C6] hidden md:flex">
                    <Link href="/dashboard/upgrade">Pricing</Link>
                </Button>

                <Button asChild variant="outline" className="text-[#6092C6]">
                    <Link href="/dashboard">My Documents</Link>
                </Button>

                <Button asChild variant= "outline" className="border-[#6092C6]">
                    <Link href='/dashboard/upload'>
                        <FilePlus2 className="text-[#6092C6]"/>
                    </Link>
                </Button>

                <UpgradeButton/>
                <UserButton/>
            </div>
        </SignedIn>
    </div>
  )
}