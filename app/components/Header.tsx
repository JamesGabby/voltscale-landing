import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container-custom">
        <nav className="flex items-center justify-between h-14 md:h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <div className="relative w-9 h-9 rounded-lg overflow-hidden transition-transform duration-300 ease-out-expo group-hover:scale-105">
              <Image
                src="/images/vs-logo.png"
                alt="VoltScale Logo"
                fill
                className="object-cover"
                sizes="36px"
                priority
              />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">
              Volt<span className="text-electric-500">Scale</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <NavLinks />
            <Link
              href="https://calendly.com/jamesgabbitus"
              target="_blank"
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium text-primary-foreground bg-electric-500 rounded-lg transition-all duration-200 ease-out-quart hover:bg-electric-600 hover:shadow-lg hover:shadow-electric-500/20 active:scale-[0.98]"
            >
              Book a Call
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex md:hidden items-center justify-center w-10 h-10 rounded-lg text-grey-600 hover:text-foreground hover:bg-grey-100 transition-colors duration-200"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </nav>
      </div>
    </header>
  );
}

function NavLinks() {
  const links = [
    { href: "", label: "" },
    // { href: "#services", label: "Services" },
    // { href: "#process", label: "Process" },
    // { href: "#results", label: "Results" },
    // { href: "#about", label: "About" },
  ];

  return (
    <ul className="flex items-center gap-1">
      {links.map((link) => (
        <li key={link.href}>
          <Link
            href={link.href}
            className="px-4 py-2 text-sm font-medium text-grey-600 rounded-lg transition-colors duration-200 hover:text-foreground hover:bg-grey-100"
          >
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}