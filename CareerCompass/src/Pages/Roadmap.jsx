import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Compass, Map, FlaskConical, Target, Terminal, Loader2, ChevronRight } from 'lucide-react';
import * as d3 from 'd3';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Roadmap = () => {
    const svgRef = useRef(null);
    const [data, setData] = useState(null);
    const [userSkills, setUserSkills] = useState([]); // Stores test results
    const [loading, setLoading] = useState(true);
    const [activePhase, setActivePhase] = useState(null);
    const navigate = useNavigate();
    const username = localStorage.getItem('username');

    // 1. Fetch Roadmap AND User Skill Scores
    useEffect(() => {
        const initializeData = async () => {
            if (!username) {
                setLoading(false);
                return;
            }

            try {
                // Parallel fetch for Roadmap and Skill Scores
                const [roadmapRes, skillsRes] = await Promise.all([
                    fetch(`http://localhost:8000/roadmap/${username}`),
                    axios.get(`http://localhost:8000/user-skills/${username}`)
                ]);

                const roadmapResult = await roadmapRes.json();
                const roadmapObj = roadmapResult.data;
                setUserSkills(skillsRes.data.skills || []);

                if (roadmapObj && roadmapObj.phases) {
                    const hierarchy = {
                        name: roadmapObj.role || "Career Path",
                        isRoot: true,
                        children: roadmapObj.phases.map(phase => ({
                            name: phase.phase_name,
                            type: 'phase',
                            duration: phase.duration_days,
                            children: (phase.skills_to_focus || []).map(skill => ({
                                name: skill.skill,
                                type: 'topic',
                                tasks: skill.tasks || []
                            }))
                        }))
                    };
                    setData({ raw: roadmapObj, tree: hierarchy });
                }
            } catch (err) {
                console.error("Error initializing roadmap data:", err);
            } finally {
                setLoading(false);
            }
        };

        initializeData();
    }, [username]);

    // 2. D3 Tree Logic
    useEffect(() => {
        if (!data || !svgRef.current) return;

        d3.select(svgRef.current).selectAll("*").remove();

        const width = svgRef.current.clientWidth;
        const height = svgRef.current.clientHeight;
        const margin = { top: 20, right: 160, bottom: 20, left: 160 };

        const svg = d3.select(svgRef.current)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        const treeLayout = d3.tree().size([height - 100, width - margin.left - margin.right]);
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

        const root = d3.hierarchy(data.tree);
        root.x0 = height / 2;
        root.y0 = 0;

        const collapse = (d) => {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        };

        if (root.children) {
            root.children.forEach(collapse);
        }

        let i = 0;
        const update = (source) => {
            const treeData = treeLayout(root);
            const nodes = treeData.descendants();
            const links = treeData.links();

            nodes.forEach(d => d.y = d.depth * 220);

            const node = svg.selectAll('g.node')
                .data(nodes, d => d.id || (d.id = ++i));

            const nodeEnter = node.enter().append('g')
                .attr('class', 'node')
                .attr("transform", d => `translate(${source.y0},${source.x0})`)
                .on('click', (event, d) => {
                    if (d.data.type === 'topic') {
                        setActivePhase(d.data);
                    } else {
                        if (d.children) {
                            d._children = d.children;
                            d.children = null;
                        } else {
                            d.children = d._children;
                            d._children = null;
                        }
                        update(d);
                    }
                });

            nodeEnter.append('circle')
                .attr('class', 'node-circle')
                .attr('r', 1e-6)
                .style("cursor", "pointer");

            nodeEnter.append('text')
                .attr("dy", ".35em")
                .attr("x", d => d.children || d._children ? -15 : 15)
                .attr("text-anchor", d => d.children || d._children ? "end" : "start")
                .text(d => d.data.name)
                .style("fill", d => d.data.isRoot ? "#fff" : "#a1a1aa")
                .style("font-size", d => d.data.isRoot ? "14px" : "11px")
                .style("pointer-events", "none")
                .style("fill-opacity", 0);

            const nodeUpdate = nodeEnter.merge(node);

            nodeUpdate.transition().duration(600)
                .attr("transform", d => `translate(${d.y},${d.x})`);

            // DYNAMIC COLOR LOGIC
            nodeUpdate.select('circle.node-circle')
                .attr('r', d => d.data.isRoot ? 10 : 6)
                .style("fill", d => {
                    if (d.data.type === 'topic') {
                        const skillRecord = userSkills.find(s => s.skill === d.data.name);
                        if (skillRecord) {
                            return skillRecord.proficiency >= 3 ? "#22c55e" : "#ef4444";
                        }
                    }
                    return d._children ? "#3b82f6" : "#09090b";
                })
                .style("stroke", d => {
                    const skillRecord = userSkills.find(s => s.skill === d.data.name);
                    if (skillRecord) {
                        return skillRecord.proficiency >= 3 ? "#22c55e" : "#ef4444";
                    }
                    return "#3b82f6";
                })
                .style("stroke-width", "2px");

            nodeUpdate.select('text').style('fill-opacity', 1);

            const nodeExit = node.exit().transition().duration(600)
                .attr("transform", d => `translate(${source.y},${source.x})`)
                .remove();

            nodeExit.select('circle').attr('r', 1e-6);
            nodeExit.select('text').style('fill-opacity', 0);

            const link = svg.selectAll('path.link')
                .data(links, d => d.target.id);

            const linkEnter = link.enter().insert('path', "g")
                .attr("class", "link")
                .attr("fill", "none")
                .attr("stroke", "#27272a")
                .attr("stroke-width", "1.5px")
                .attr('d', d => {
                    const o = { x: source.x0, y: source.y0 };
                    return diagonal({ source: o, target: o });
                });

            linkEnter.merge(link).transition().duration(600).attr('d', d => diagonal(d));

            link.exit().transition().duration(600)
                .attr('d', d => {
                    const o = { x: source.x, y: source.y };
                    return diagonal({ source: o, target: o });
                }).remove();

            nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
        };

        update(root);
    }, [data, userSkills]);

    if (loading) return <TreeLoader />;
    if (!data) return <div className="min-h-screen bg-black flex items-center justify-center text-zinc-500">No data found.</div>;

    return (
        <div className="min-h-screen bg-[#050505] text-zinc-100 pt-24 pb-20 px-6 flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-blue-600/10 blur-[140px] pointer-events-none" />
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12 relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black tracking-widest uppercase mb-6">
                    <Compass size={12} /> Personalized Learning Path
                </div>
                <h1 className="text-5xl md:text-6xl font-bold tracking-tighter mb-4 italic">
                    {data.raw.role} <span className="text-zinc-600">Map.</span>
                </h1>
                <div className="flex items-center justify-center gap-8 text-zinc-500 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-2"><Target size={14} className="text-blue-500" /> Readiness: {data.raw.readinessScore}%</span>
                    <span className="flex items-center gap-2"><Map size={14} className="text-blue-500" /> {data.raw.estimated_days_to_job_ready} Day Sprint</span>
                </div>
            </motion.div>

            <div className="w-full max-w-6xl h-[650px] border border-zinc-800/50 rounded-[2.5rem] bg-zinc-900/20 backdrop-blur-md relative overflow-hidden group shadow-2xl">
                <div className="absolute top-6 left-8 flex items-center gap-2 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Interactive Visualizer
                </div>
                <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
            </div>

            <div className="mt-8 flex items-center gap-4 text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                Click nodes to drill down <ChevronRight size={12} /> Explore Skills <Sparkles size={12} className="text-yellow-500" />
            </div>

            <AnimatePresence>
                {activePhase && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                        onClick={() => setActivePhase(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="w-full max-w-lg bg-zinc-900 border border-zinc-800 p-8 rounded-[2rem] shadow-3xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-4 mb-6">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                                    <Terminal size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">{activePhase.name}</h3>
                                    <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Syllabus Breakdown</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => navigate(`/test/${username}/${encodeURIComponent(activePhase.name)}`)}
                                className="w-full mb-6 py-4 bg-blue-600/20 border border-blue-500/40 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-all flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest"
                            >
                                <Sparkles size={16} /> Verify Skill via Assessment
                            </button>
                            
                            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {activePhase.tasks?.map((task, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-zinc-800/30 border border-zinc-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        <p className="text-sm text-zinc-300 group-hover:text-white transition-colors">{task}</p>
                                    </div>
                                ))}
                            </div>

                            <button 
                                onClick={() => setActivePhase(null)}
                                className="w-full py-4 bg-zinc-100 text-black font-black text-xs uppercase tracking-widest rounded-xl hover:bg-white transition-all active:scale-[0.98]"
                            >
                                Close Insight
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TreeLoader = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505] space-y-6">
        <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
        </div>
        <div className="text-center">
            <h2 className="text-zinc-100 font-bold tracking-tighter text-xl italic text-zinc-100">Generating Roadmap</h2>
            <p className="text-zinc-500 text-xs uppercase tracking-[0.2em] mt-2">Syncing performance data...</p>
        </div>
    </div>
);

export default Roadmap;