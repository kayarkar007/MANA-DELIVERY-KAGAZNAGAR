import connectToDatabase from "@/lib/mongoose";
import Category from "@/models/Category";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import * as motion from "framer-motion/client";
import SearchBar from "@/components/SearchBar";

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

  return (
    <div className="space-y-10 sm:space-y-14 md:space-y-16">

      {/* Hero — mobile first: compact on small, scale up on sm/md/lg */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl md:rounded-[2.5rem] bg-gray-900 text-white shadow-2xl"
      >
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=2000"
            alt="Hero Background"
            fill
            className="object-cover opacity-30 mix-blend-overlay"
            priority
          />
          <div className="absolute inset-0 bg-linear-to-r from-gray-900 via-gray-900/80 to-transparent"></div>
        </div>

        <div className="relative z-10 p-4 sm:p-6 md:p-10 lg:p-20 flex flex-col items-start justify-center min-h-[260px] sm:min-h-[320px] md:min-h-[380px] lg:min-h-[400px]">
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase tracking-widest text-[10px] sm:text-xs mb-4 sm:mb-6 backdrop-blur-md border border-blue-400/30">
            Local Delivery Redefined
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-[1.1] mb-4 sm:mb-6 max-w-2xl">
            Everything you need, <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-indigo-300">
              delivered fast.
            </span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 max-w-xl font-medium mb-6 sm:mb-8 md:mb-10 leading-relaxed">
            From fresh daily groceries to instant medicine delivery and home services.
            Experience the super app built for your local neighborhood.
          </p>

          <div className="w-full max-w-2xl mb-6 sm:mb-8 md:mb-10">
            <SearchBar />
          </div>

          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#categories"
            className="px-5 py-3 sm:px-6 sm:py-3.5 md:px-8 md:py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-full font-black hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-[0_0_40px_rgba(255,255,255,0.3)] dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
          >
            Explore Services <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.a>
        </div>
      </motion.div>

      <div id="categories" className="space-y-6 sm:space-y-8 scroll-mt-24">
        <div className="flex items-end justify-between px-1 sm:px-2">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">Shop by Category</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1 sm:mt-2 text-sm sm:text-base">What are you looking for today?</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {categories.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center p-8 sm:p-12 md:p-16 bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 shadow-sm">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 dark:text-gray-700 mb-3 sm:mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-medium text-base sm:text-lg">No categories found yet.</p>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-1">Please add some from the Admin Panel.</p>
              <Link
                href="/admin"
                className="mt-6 px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-bold hover:bg-gray-800 transition-colors"
              >
                Go to Admin
              </Link>
            </div>
          ) : (
            <motion.div
              className="col-span-full grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: {},
                show: {
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
            >
              {categories.map((category: any) => (
                <motion.div
                  key={category._id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                  }}
                >
                  <Link
                    href={`/category/${category.slug}`}
                    className="block group relative overflow-hidden rounded-4xl aspect-4/5 shadow-sm hover:shadow-2xl transition-all duration-500"
                  >
                    {category.image ? (
                      <Image
                        src={category.image}
                        alt={category.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`absolute inset-0 ${category.type === "service"
                        ? "bg-linear-to-br from-purple-400 to-indigo-600"
                        : "bg-linear-to-br from-blue-400 to-cyan-500"
                        }`}></div>
                    )}

                    <div className="absolute inset-0 bg-linear-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                    <div className="absolute inset-0 p-3 sm:p-4 md:p-6 flex flex-col justify-end">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md mb-2 sm:mb-3 inline-block backdrop-blur-md ${category.type === "service" ? "bg-purple-500/30 text-purple-100" : "bg-blue-500/30 text-blue-100"
                          }`}>
                          {category.type}
                        </span>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white leading-tight mb-1 sm:mb-2 drop-shadow-md">
                          {category.name}
                        </h3>
                        <div className="flex items-center text-white/80 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                          View items <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
