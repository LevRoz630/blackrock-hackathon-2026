# Friction Timing Research

Sources and key findings to inform the design of the reflection prompt.

---

## Key facts

- The **dismiss/continue choice** is the single most powerful component of a friction intervention — more than the delay itself (effect size d = 0.74). Deliberation messages alone had no measurable effect. (Grüning et al., PNAS 2023)
- **10 seconds** of friction caused 36% of app-opening attempts to be abandoned and a 57% reduction in app opens over 6 weeks. (one sec / PNAS 2023)
- **30 seconds** is borderline for System 2 activation; **60 seconds** reliably triggers deliberate thinking. 40 seconds sits in the productive middle. (CRT manipulation study, 2024)
- **Adaptive timing outperforms fixed timing by 32.8%** on intervention accuracy and 8% on user receptivity. Adding explanations for why the intervention fired improved effectiveness another 53.8%. (Time2Stop, CHI 2024)
- **Friction is 16% more effective than hard lockouts** at reducing usage. 62% of users kept friction tools active vs 36% for lockouts. (University of Michigan InteractOut, 2024)
- Reframing costs as **concrete future dates** ("by March 30th you'll be £120 short") reduces impulsive choices more than abstract warnings. (Temporal discounting meta-analysis, PMC 2018)
---

## ScreenZen case study

- Uses **escalating friction**: delay increases with each repeated app open in the same day. First open is short (~5s), subsequent opens get progressively longer.
- Rationale: first use might be intentional, repeated use is almost certainly impulsive.
- Combines friction (entry gate) with session limits (usage cap) and daily open limits.

---

## Design takeaways

1. **The choice matters more than the clock.** The prompt must force an explicit binary decision ("Continue Purchase" / "I Changed My Mind"), not just run a timer.
2. **40 seconds is well-supported for a starting point.** Between 30s (borderline) and 60s (full System 2). Enough to engage reflection, short enough to not feel punitive.
3. **Adaptive is better than fixed.** Scale delay based on purchase size, deviation from normal spend, time of day, spending velocity. Fixed is fine for MVP; adaptive for v2.
4. **Show the concrete future cost.** "This takes your weekend spend to £85. You'll be £120 short before next loan payment" beats "Are you sure?"
6. **Escalating friction for repeat spending is promising.** First overspend of the day gets a shorter prompt; third overspend gets a longer one. Mirrors ScreenZen's validated UX pattern.
7. **Preserve user agency.** Friction works because it's not a block. Hard blocks cause resentment and workarounds. The user must always be able to proceed.

---

## Sources

- Grüning, D.J., Riedel, F., & Lorenz-Spreen, P. (2023). "Directing smartphone use through the self-nudge app one sec." *PNAS*. https://www.pnas.org/doi/10.1073/pnas.2213114120
- "Manipulating response times in the cognitive reflection test" (2024). *Journal of Behavioral and Experimental Economics*. https://www.sciencedirect.com/science/article/pii/S2214804324001101
- "Cooling Off and the Effects of Mandatory Breaks in Online Gambling" (2023). *International Journal of Mental Health and Addiction*. https://pmc.ncbi.nlm.nih.gov/articles/PMC9844935/
- Time2Stop: Adaptive and Explainable Human-AI Loop for Smartphone Overuse Intervention (CHI 2024). https://dl.acm.org/doi/10.1145/3613904.3642747
- A Longitudinal In-the-Wild Investigation of Design Frictions (CHI 2024). https://dl.acm.org/doi/10.1145/3613904.3642370
- "Experimental Reductions of Delay Discounting and Impulsive Choice: A Systematic Review and Meta-Analysis" (2018). *PMC*. https://pmc.ncbi.nlm.nih.gov/articles/PMC6112163/
- "Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health" (2017). *PMC*. https://pmc.ncbi.nlm.nih.gov/articles/PMC5364076/
- Fintech Nudges: Overspending Messages and Personal Finance Management. *NYU Stern / SSRN*. https://www.stern.nyu.edu/experience-stern/about/departments-centers-initiatives/centers-of-research/fubon-center-technology-business-and-innovation/research/research-papers/doctoral-fellow-research/fintech-nudges
- University of Michigan InteractOut Study (2024). https://news.umich.edu/managing-screen-time-by-making-phones-slightly-more-annoying-to-use/
- one sec blog: "How one sec works." https://one-sec.app/blog/how-one-sec-works/
- one sec blog: "Friction will change your behavior." https://one-sec.app/blog/friction-will-change-your-behavior/
- Monzo Spending Block. https://community.monzo.com/t/now-in-labs-spending-block/152249
