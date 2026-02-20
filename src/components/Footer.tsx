export default function Footer() {
    return (
        <footer className="py-8 px-6 border-t border-slate-800/50">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-center md:text-left">
                        <span className="text-xl font-bold">
                            <span className="text-white">NextUp</span>
                            <span className="text-gradient"> Mentor</span>
                        </span>
                        <p className="text-slate-500 text-sm mt-1">Your gateway to European education</p>
                    </div>
                    <p className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} NextUp Mentor. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
