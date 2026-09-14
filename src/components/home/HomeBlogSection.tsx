'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import type { PublicPost } from '@/lib/cms-posts';

type Props = {
    posts: PublicPost[];
    onPostOpen?: () => void;
};

function PostMeta({ post }: { post: PublicPost }) {
    return (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground sm:text-[11px]">
            <span>{post.category}</span>
            <span aria-hidden="true" className="text-foreground/20">/</span>
            <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </time>
        </div>
    );
}

export function HomeBlogSection({ posts, onPostOpen }: Props) {
    const reduceMotion = useReducedMotion();
    const visiblePosts = posts.slice(0, 5);
    const [leadPost, ...supportingPosts] = visiblePosts;

    if (!leadPost) return null;

    return (
        <section id="home-blog" className="scroll-mt-24 border-t border-foreground/10 bg-background px-6 py-12 md:px-16 md:py-14 lg:scroll-mt-28 lg:px-24 lg:py-16">
            <div className="mx-auto w-full max-w-[1400px]">
                <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.7 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-7 flex flex-wrap items-center justify-between gap-5 border-b border-foreground/10 pb-6"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full bg-primary/80 shadow-[0_0_18px_hsl(var(--primary)/0.3)]" />
                        <p className="font-mono text-sm font-semibold uppercase tracking-[0.28em] text-foreground/80">Journal</p>
                        <span className="rounded-md border border-foreground/10 px-2 py-1 font-mono text-[10px] text-muted-foreground">{visiblePosts.length}</span>
                    </div>
                    <Link href="/blog" onClick={onPostOpen} className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground/65 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                        View all posts <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 motion-reduce:transform-none" />
                    </Link>
                </motion.div>

                <div className="grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:gap-10">
                    <motion.article
                        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: reduceMotion ? 0 : 0.48, ease: [0.16, 1, 0.3, 1] }}
                        className="min-w-0"
                    >
                        <Link
                            href={`/blog/${leadPost.slug}`}
                            onClick={onPostOpen}
                            className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                        >
                            <div className="aspect-[16/9] overflow-hidden border border-foreground/10 bg-foreground/[0.025]">
                                {leadPost.content.featuredImage ? (
                                    <img
                                        src={leadPost.content.featuredImage}
                                        alt=""
                                        className="h-full w-full object-cover transition-[transform,filter] duration-700 ease-out group-hover:scale-[1.025] group-hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none"
                                    />
                                ) : (
                                    <div aria-hidden="true" className="h-full w-full bg-foreground/[0.035]" />
                                )}
                            </div>

                            <div className="border-b border-foreground/10 pb-7 pt-5">
                                <PostMeta post={leadPost} />
                                <div className="mt-3 flex items-start justify-between gap-5">
                                    <div className="min-w-0">
                                        <h3 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-foreground transition-colors group-hover:text-primary sm:text-4xl">
                                            {leadPost.title}
                                        </h3>
                                        {leadPost.excerpt ? (
                                            <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground sm:text-base">
                                                {leadPost.excerpt}
                                            </p>
                                        ) : null}
                                    </div>
                                    <ArrowUpRight className="mt-1 size-5 shrink-0 text-muted-foreground transition duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-foreground motion-reduce:transform-none" />
                                </div>
                                <span className="mt-5 inline-block font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/70">
                                    Read featured story
                                </span>
                            </div>
                        </Link>
                    </motion.article>

                    <div className="min-w-0 border-t border-foreground/10 lg:border-l lg:border-t-0 lg:pl-10">
                        <p className="pb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Latest publications
                        </p>

                        {supportingPosts.map((post, index) => (
                            <motion.article
                                key={post.id}
                                initial={reduceMotion ? false : { opacity: 0, x: 14 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true, amount: 0.5 }}
                                transition={{ duration: reduceMotion ? 0 : 0.4, delay: Math.min(index * 0.07, 0.21), ease: [0.16, 1, 0.3, 1] }}
                                className="border-t border-foreground/10"
                            >
                                <Link
                                    href={`/blog/${post.slug}`}
                                    onClick={onPostOpen}
                                    className="group grid min-h-32 grid-cols-[minmax(0,1fr)_88px] items-center gap-4 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:grid-cols-[minmax(0,1fr)_112px] sm:gap-6"
                                >
                                    <div className="min-w-0">
                                        <PostMeta post={post} />
                                        <div className="mt-2 flex items-start justify-between gap-3">
                                            <h3 className="text-lg font-semibold leading-snug tracking-tight text-foreground transition-colors group-hover:text-primary sm:text-xl">
                                                {post.title}
                                            </h3>
                                            <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground motion-reduce:transform-none" />
                                        </div>
                                        {post.excerpt ? (
                                            <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                                                {post.excerpt}
                                            </p>
                                        ) : null}
                                    </div>

                                    <div className="aspect-[4/3] overflow-hidden border border-foreground/10 bg-foreground/[0.025]">
                                        {post.content.featuredImage ? (
                                            <img
                                                src={post.content.featuredImage}
                                                alt=""
                                                className="h-full w-full object-cover transition-[transform,filter] duration-500 ease-out group-hover:scale-[1.04] group-hover:brightness-110 motion-reduce:transform-none motion-reduce:transition-none"
                                            />
                                        ) : (
                                            <div aria-hidden="true" className="h-full w-full bg-foreground/[0.035]" />
                                        )}
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
