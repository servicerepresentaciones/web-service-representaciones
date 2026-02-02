import { Search, Bell, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface AdminHeaderProps {
    userEmail?: string;
    onMenuClick?: () => void;
}

const AdminHeader = ({ userEmail, onMenuClick }: AdminHeaderProps) => {
    return (
        <header className="h-20 bg-white px-8 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4 flex-1">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                    <Menu className="w-6 h-6" />
                </Button>
                <div className="relative w-full max-w-md hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="pl-10 h-10 bg-[#F5F6FA] border-none rounded-2xl focus-visible:ring-1"
                    />
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="relative">
                    <Bell className="w-6 h-6 text-blue-500" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold border-2 border-white">
                        6
                    </span>
                </div>



                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer">
                            <Avatar className="w-10 h-10">
                                <AvatarImage src="https://github.com/shadcn.png" />
                                <AvatarFallback>AD</AvatarFallback>
                            </Avatar>
                            <div className="hidden sm:block text-left">
                                <p className="text-sm font-bold text-gray-700">Admin User</p>
                                <p className="text-xs text-gray-500">{userEmail || 'admin@example.com'}</p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default AdminHeader;
