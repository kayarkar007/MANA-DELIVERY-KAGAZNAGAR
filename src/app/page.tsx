import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import dynamic from "next/dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const SearchBar = dynamic(() => import("@/components/SearchBar"));
const RoleBanner = dynamic(() => import("@/components/RoleBanner"));

// Revalidate the page every 10 seconds or force dynamic
export const revalidate = 0;

async function getCategories() {
  try {
    await connectToDatabase();
    const categories = await Category.find({}).sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(categories));
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export default async function Home() {
  const categories = await getCategories();
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-16">
      <RoleBanner role={session?.user?.role} />
      {/* Hero — mobile first: compact on small, scale up on sm/md/lg */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] bg-slate-950 text-white premium-shadow"
      >
        <div className="absolute inset-0 z-0 scale-105 animate-float opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=40&w=1200&v=avif_opt2"
            alt="Hero Background"
            fill
            quality={40}
            sizes="100vw"
            className="object-cover mix-blend-soft-light"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent"></div>
        </div>

        <div className="relative z-10 p-6 sm:p-12 md:p-20 flex flex-col items-center text-center justify-center min-h-[400px] sm:min-h-[500px]">
          <motion.span 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="px-4 py-1.5 rounded-full bg-red-500/10 text-red-500 font-black uppercase tracking-[0.2em] text-[10px] sm:text-xs mb-8 backdrop-blur-xl border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            Mana Delivery
          </motion.span>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-8 max-w-4xl drop-shadow-2xl">
            Reliability <br /> 
            <span className="text-gradient">delivered.</span>
          </h1>
          
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl font-medium mb-10 leading-relaxed opacity-90">
            Groceries, medicines, and essential services from your favorite local shops, 
            delivered to your doorstep in minutes.
          </p>

          <div className="w-full max-w-xl glass-card p-2 rounded-[2rem] shadow-2xl animate-slide-up">
            <SearchBar />
          </div>
        </div>
      </motion.div>

      <div id="categories" className="space-y-10 sm:space-y-14 pt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Our Services</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2 text-base sm:text-lg">Fresh essentials and expert services, just for you.</p>
          </div>
          <motion.a
            href="/search"
            whileHover={{ x: 5 }}
            className="group flex items-center gap-2 text-red-600 font-black text-sm sm:text-base uppercase tracking-wider"
          >
            Explore All <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.a>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-8">
          {categories.length === 0 ? (
            <div className="col-span-full glass-card p-20 flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
              <ShoppingBag className="w-20 h-20 text-slate-200 dark:text-slate-800 mb-6" />
              <p className="text-slate-500 font-black text-2xl">No services found</p>
              <Link
                href="/admin"
                className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-full font-black premium-shadow hover:scale-105 transition-all"
              >
                Setup Store
              </Link>
            </div>
          ) : (
            categories.map((category: any, idx: number) => (
              <motion.div
                key={category._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="h-full"
              >
                <Link
                  href={`/category/${category.slug}`}
                  className="block group relative overflow-hidden rounded-[2.5rem] aspect-[4/5] glass-card premium-shadow transition-all duration-700 hover:-translate-y-2 hover:shadow-blue-500/10 h-full"
                >
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        quality={50}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        className="object-cover transition-transform duration-1000 group-hover:scale-115"
                      />
                    ) : (
                      <div className={`absolute inset-0 bg-gradient-to-br ${
                        category.type === "service" ? "from-indigo-500 to-purple-600" : "from-blue-500 to-emerald-400"
                      }`} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                  </div>

                  <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-end">
                    <div className="space-y-3">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${
                        category.type === "service" ? "bg-purple-500/20 text-purple-200 border-purple-500/30" : "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
                      }`}>
                        {category.type}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight drop-shadow-md">
                        {category.name}
                      </h3>
                      <div className="flex items-center gap-2 text-white/60 text-xs font-black uppercase tracking-widest translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        View More <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
