import { PageFrame } from "@/components/rivtor/PageFrame";

const posts = [
  {
    title: "Why decision_id is the primitive for autonomous companies",
    meta: "Architecture · 8 min",
  },
  {
    title: "Designing governed autonomy without killing execution speed",
    meta: "Governance · 6 min",
  },
  {
    title: "Event-sourced operations: replaying your business state",
    meta: "Operations · 9 min",
  },
];

const Blog = () => {
  return (
    <PageFrame
      eyebrow="BLOG"
      title="Notes from the Rivtor build log"
      description="Deep dives on decision systems, governance design, and operating autonomous software companies."
    >
      <div className="space-y-px bg-white/[0.06] hairline">
        {posts.map((post) => (
          <article key={post.title} className="flex flex-col gap-4 bg-rv px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="label-eyebrow text-rv-dim">{post.meta}</div>
              <h2 className="font-display mt-3 text-[22px] leading-[1.2] tracking-[-0.02em] sm:text-[26px]">{post.title}</h2>
            </div>
            <span className="label-eyebrow text-rv-violet">READ →</span>
          </article>
        ))}
      </div>
    </PageFrame>
  );
};

export default Blog;
