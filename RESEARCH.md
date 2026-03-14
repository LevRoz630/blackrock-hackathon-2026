# Friction Timing Research

Sources and key findings to inform the design of the reflection prompt.

---

## Key facts

- The **dismiss/continue choice** is the single most powerful component of a friction intervention — more than the delay itself (effect size d = 0.74). Deliberation messages alone had no measurable effect. (Grüning et al., PNAS 2023)
- **10 seconds** of friction caused 36% of app-opening attempts to be abandoned and a 57% reduction in app opens over 6 weeks. (one sec / PNAS 2023)
- **30 seconds** is borderline for System 2 activation; **60 seconds** reliably triggers deliberate thinking. 40 seconds sits in the productive middle. (CRT manipulation study, 2024)
- **Adaptive timing outperforms fixed timing by 32.8%** on intervention accuracy and 8% on user receptivity. Adding explanations for why the intervention fired improved effectiveness another 53.8%. (Time2Stop, CHI 2024)
- **Friction is 16% more effective than hard lockouts** at reducing usage. 62% of users kept friction tools active vs 36% for lockouts. (University of Michigan InteractOut, 2024)
- In online gambling, a **5-minute mandatory break** increased time-to-next-session by 368% for impulsive users. A 15-minute break increased it by 1,863%. Retention stayed at ~97% across all groups. (Springer, 2023)
- Monzo's **48-hour cooling-off** to remove a gambling block: 275,000+ users activated it, fewer than 10% ever removed it permanently.
- Reframing costs as **concrete future dates** ("by March 30th you'll be £120 short") reduces impulsive choices more than abstract warnings. (Temporal discounting meta-analysis, PMC 2018)
- Overspending nudge messages from a Canadian bank reduced next-day spending by **5.4%** with permanent effects on cumulative spend. (NYU Stern / SSRN)
- Users report breathing exercises become a "speed bump" over time — **habituation is real** but recoverable when users take breaks and re-engage. (CHI 2024 longitudinal study, 1,039 users over 13.4 weeks)
- In fintech, delays over **5 seconds without explanation** are interpreted as system errors. The intervention UI must load instantly and signal intent. (Nielsen Norman Group)

---

## ScreenZen case study

- 500,000+ monthly active users, 4.8 stars from 30,000+ reviews, donation-funded.
- Uses **escalating friction**: delay increases with each repeated app open in the same day. First open is short (~5s), subsequent opens get progressively longer.
- Rationale: first use might be intentional, repeated use is almost certainly impulsive.
- Combines friction (entry gate) with session limits (usage cap) and daily open limits.
- Includes settings locks to prevent impulsive configuration changes.
- No published academic study, but strong user retention signals.
- Key weakness reported by users: a 60-minute bypass button undermines the system once discovered.

---

## one sec case study

- Created by Frederik Riedel. Studied in collaboration with Max Planck Institute and Heidelberg University.
- Core mechanism: **10-second breathing exercise** before any managed app opens, plus a dismiss/continue choice.
- PNAS study (N=280, 6 weeks): 57% reduction in app opens, ~77 minutes/day saved, increased user satisfaction.
- The breathing exercise is the most recognisable element, but the **dismiss button drove most of the effect**.
- Key weakness: no time limits after bypass — once past the breathing exercise, access is unlimited.
- Users report the breathing exercise becomes annoying with repetition. Paid version offers variety (rotate phone, follow a dot, view yourself via camera).

---

## Design takeaways

1. **The choice matters more than the clock.** The prompt must force an explicit binary decision ("Continue Purchase" / "I Changed My Mind"), not just run a timer.
2. **40 seconds is well-supported for a starting point.** Between 30s (borderline) and 60s (full System 2). Enough to engage reflection, short enough to not feel punitive.
3. **Adaptive is better than fixed.** Scale delay based on purchase size, deviation from normal spend, time of day, spending velocity. Fixed is fine for MVP; adaptive for v2.
4. **The UI must feel intentional.** In a transaction context, any unexplained delay reads as a system failure. The prompt must load instantly with clear framing.
5. **Show the concrete future cost.** "This takes your weekend spend to £85. You'll be £120 short before next loan payment" beats "Are you sure?"
6. **Vary the prompt to combat habituation.** Same breathing exercise every time becomes dismissible. Rotate between reflection questions, future-cost framing, and contextual stats.
7. **Escalating friction for repeat spending is promising.** First overspend of the day gets a shorter prompt; third overspend gets a longer one. Mirrors ScreenZen's validated UX pattern.
8. **Preserve user agency.** Friction works because it's not a block. Hard blocks cause resentment and workarounds. The user must always be able to proceed.

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
