#!/usr/bin/env python3
"""Generate Assignment 3 charts and table images from experimental artifacts."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd


def read_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_table_image(df: pd.DataFrame, title: str, output_path: Path, fontsize: int = 10) -> None:
    rows = max(3, len(df) + 2)
    fig, ax = plt.subplots(figsize=(12, min(1.2 + rows * 0.5, 10)))
    ax.axis("off")
    table = ax.table(
        cellText=df.values,
        colLabels=df.columns,
        loc="center",
        cellLoc="center",
    )
    table.auto_set_font_size(False)
    table.set_fontsize(fontsize)
    table.scale(1, 1.3)
    ax.set_title(title, fontsize=14, pad=12)
    fig.tight_layout()
    fig.savefig(output_path, dpi=220, bbox_inches="tight")
    plt.close(fig)


def build_performance_figures(perf_summary: dict[str, Any], output_dir: Path) -> list[Path]:
    created: list[Path] = []
    df = pd.DataFrame(perf_summary["summary"])

    # Scenario aggregate table
    scenario_agg = (
        df.groupby("scenario", as_index=False)
        .agg(
            avg_latency_ms=("averageLatencyMs", "mean"),
            max_p95_ms=("p95LatencyMs", "max"),
            avg_throughput_rps=("throughputRps", "mean"),
            avg_error_rate_percent=("errorRatePercent", "mean"),
        )
        .sort_values("scenario")
    )
    pass_mask = df["thresholdPass"].apply(lambda x: bool(x.get("errorRate")) and bool(x.get("p95")))
    fail_counts = (
        df.assign(pass_all=pass_mask)
        .groupby("scenario", as_index=False)
        .agg(threshold_fails=("pass_all", lambda s: int((~s).sum())))
    )
    scenario_agg = scenario_agg.merge(fail_counts, on="scenario", how="left")
    scenario_agg = scenario_agg.round(2)
    path = output_dir / "performance_scenario_summary_table.png"
    save_table_image(scenario_agg, "Performance Scenario Summary", path)
    created.append(path)

    # P95 heatmap by scenario x endpoint
    pivot = df.pivot(index="scenario", columns="endpoint", values="p95LatencyMs")
    pivot = pivot.reindex(["normal", "peak", "spike", "endurance"]).fillna(0)

    fig, ax = plt.subplots(figsize=(12, 5))
    im = ax.imshow(pivot.values, cmap="YlOrRd", aspect="auto")
    ax.set_xticks(np.arange(len(pivot.columns)))
    ax.set_xticklabels(pivot.columns, rotation=20, ha="right")
    ax.set_yticks(np.arange(len(pivot.index)))
    ax.set_yticklabels(pivot.index)
    ax.set_title("Performance p95 Latency Heatmap (ms)")
    for i in range(pivot.shape[0]):
        for j in range(pivot.shape[1]):
            ax.text(j, i, f"{pivot.values[i, j]:.0f}", ha="center", va="center", fontsize=9)
    cbar = fig.colorbar(im, ax=ax)
    cbar.set_label("p95 ms")
    fig.tight_layout()
    path = output_dir / "performance_p95_heatmap.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    # Throughput by scenario and endpoint
    fig, ax = plt.subplots(figsize=(12, 6))
    for endpoint, group in df.groupby("endpoint"):
        group = group.set_index("scenario").reindex(["normal", "peak", "spike", "endurance"]).reset_index()
        ax.plot(group["scenario"], group["throughputRps"], marker="o", linewidth=2, label=endpoint)
    ax.set_title("Throughput by Scenario and Endpoint")
    ax.set_ylabel("Requests per second")
    ax.set_xlabel("Scenario")
    ax.grid(alpha=0.25)
    ax.legend(loc="best", fontsize=8)
    fig.tight_layout()
    path = output_dir / "performance_throughput_lines.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    # Error rate bar chart
    ordered = df.copy()
    ordered["label"] = ordered["scenario"] + " | " + ordered["endpoint"]
    fig, ax = plt.subplots(figsize=(13, 5.5))
    x_positions = np.arange(len(ordered))
    ax.bar(x_positions, ordered["errorRatePercent"], color="#4f81bd")
    ax.set_title("Error Rate by Scenario and Endpoint")
    ax.set_ylabel("Error rate (%)")
    ax.set_xticks(x_positions)
    ax.set_xticklabels(ordered["label"], rotation=55, ha="right", fontsize=8)
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    path = output_dir / "performance_error_rate_bars.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    return created


def build_mutation_figures(mutation_summary: dict[str, Any], output_dir: Path) -> list[Path]:
    created: list[Path] = []

    modules = mutation_summary.get("modules", {})
    module_df = (
        pd.DataFrame(
            [
                {
                    "module": module,
                    "created": values["created"],
                    "killed": values["killed"],
                    "survived": values["survived"],
                    "mutation_score_percent": values["mutationScore"],
                }
                for module, values in modules.items()
            ]
        )
        .sort_values("module")
        .reset_index(drop=True)
    )

    # Table
    path = output_dir / "mutation_module_table.png"
    save_table_image(module_df.round(2), "Mutation Module Summary", path)
    created.append(path)

    # Bar chart
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.bar(module_df["module"], module_df["mutation_score_percent"], color="#70ad47")
    ax.set_ylim(0, 110)
    ax.set_ylabel("Mutation score (%)")
    ax.set_title("Mutation Score by Module")
    ax.grid(axis="y", alpha=0.25)
    for idx, value in enumerate(module_df["mutation_score_percent"].tolist()):
        ax.text(idx, value + 2, f"{value:.0f}%", ha="center", fontsize=9)
    fig.tight_layout()
    path = output_dir / "mutation_module_scores.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    # Totals pie
    totals = mutation_summary["totals"]
    labels = ["Killed", "Survived", "Errors"]
    values = [totals["killed"], totals["survived"], totals["errors"]]
    fig, ax = plt.subplots(figsize=(6.5, 6.5))
    ax.pie(values, labels=labels, autopct="%1.0f%%", startangle=90, colors=["#5b9bd5", "#ed7d31", "#a5a5a5"])
    ax.set_title("Mutation Outcome Distribution")
    fig.tight_layout()
    path = output_dir / "mutation_outcome_pie.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    return created


def build_chaos_figures(chaos_summary: dict[str, Any], output_dir: Path) -> list[Path]:
    created: list[Path] = []

    rows = []
    for row in chaos_summary["results"]:
        metrics = row["metrics"]
        fault = row.get("faultInjected", {})
        rows.append(
            {
                "scenario": row["scenario"],
                "availability_percent": metrics["availabilityPercent"],
                "failed_probe_samples": metrics["failedProbeSamples"],
                "total_probe_samples": metrics["totalProbeSamples"],
                "recovery_ms": metrics["recoveryMs"] if metrics["recoveryMs"] is not None else np.nan,
                "fault_injected": bool(fault.get("injected", False)),
            }
        )
    df = pd.DataFrame(rows).sort_values("scenario").reset_index(drop=True)

    # Table
    table_df = df.copy()
    table_df["fault_injected"] = table_df["fault_injected"].map({True: "yes", False: "no"})
    table_df = table_df.rename(
        columns={
            "scenario": "scenario",
            "availability_percent": "availability_percent",
            "failed_probe_samples": "failed_samples",
            "total_probe_samples": "total_samples",
            "recovery_ms": "recovery_ms",
            "fault_injected": "fault_injected",
        }
    )
    save_path = output_dir / "chaos_summary_table.png"
    save_table_image(table_df.round(2), "Chaos Scenario Summary", save_path)
    created.append(save_path)

    # Availability + recovery bars
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    axes[0].bar(df["scenario"], df["availability_percent"], color="#4472c4")
    axes[0].set_ylim(0, 105)
    axes[0].set_title("Chaos Availability by Scenario")
    axes[0].set_ylabel("Availability (%)")
    axes[0].grid(axis="y", alpha=0.25)

    axes[1].bar(df["scenario"], df["recovery_ms"], color="#c55a11")
    axes[1].set_title("Chaos Recovery Time by Scenario")
    axes[1].set_ylabel("Recovery (ms)")
    axes[1].grid(axis="y", alpha=0.25)
    fig.tight_layout()
    path = output_dir / "chaos_availability_recovery.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    # Network latency probe timeline
    network_row = next((row for row in chaos_summary["results"] if row["scenario"] == "network-latency"), None)
    if network_row:
        points = []
        for phase in ["pre", "during", "post"]:
            for sample in network_row["probes"][phase]:
                points.append(
                    {
                        "phase": phase,
                        "latency_ms": sample["latencyMs"],
                        "ok": sample["ok"],
                    }
                )
        probe_df = pd.DataFrame(points).reset_index().rename(columns={"index": "step"})
        fig, ax = plt.subplots(figsize=(12, 5))
        colors = probe_df["phase"].map({"pre": "#70ad47", "during": "#ed7d31", "post": "#5b9bd5"})
        ax.scatter(probe_df["step"], probe_df["latency_ms"], c=colors, s=45)
        ax.plot(probe_df["step"], probe_df["latency_ms"], alpha=0.25, color="#404040")
        ax.set_title("Network-Latency Scenario Probe Timeline")
        ax.set_xlabel("Probe step")
        ax.set_ylabel("Latency (ms)")
        ax.grid(alpha=0.25)
        legend_handles = [
            plt.Line2D([0], [0], marker="o", color="w", label="pre", markerfacecolor="#70ad47", markersize=8),
            plt.Line2D([0], [0], marker="o", color="w", label="during", markerfacecolor="#ed7d31", markersize=8),
            plt.Line2D([0], [0], marker="o", color="w", label="post", markerfacecolor="#5b9bd5", markersize=8),
        ]
        ax.legend(handles=legend_handles, title="Phase")
        fig.tight_layout()
        path = output_dir / "chaos_network_latency_timeline.png"
        fig.savefig(path, dpi=220, bbox_inches="tight")
        plt.close(fig)
        created.append(path)

    return created


def build_combined_figure(perf_summary: dict[str, Any], mutation_summary: dict[str, Any], chaos_summary: dict[str, Any], output_dir: Path) -> list[Path]:
    created: list[Path] = []

    perf_df = pd.DataFrame(perf_summary["summary"])
    perf_pass = perf_df["thresholdPass"].apply(lambda x: bool(x.get("errorRate")) and bool(x.get("p95"))).sum()
    perf_total = len(perf_df)
    perf_fail = perf_total - perf_pass

    mutation_totals = mutation_summary["totals"]
    chaos_results = chaos_summary["results"]
    chaos_injected = sum(1 for r in chaos_results if r.get("faultInjected", {}).get("injected"))
    chaos_total = len(chaos_results)

    summary_df = pd.DataFrame(
        [
            {"area": "performance", "pass_like": perf_pass, "follow_up": perf_fail},
            {"area": "mutation", "pass_like": mutation_totals["killed"], "follow_up": mutation_totals["survived"] + mutation_totals["errors"]},
            {"area": "chaos", "pass_like": chaos_injected, "follow_up": chaos_total - chaos_injected},
        ]
    )

    fig, ax = plt.subplots(figsize=(9, 5))
    x = np.arange(len(summary_df))
    width = 0.35
    ax.bar(x - width / 2, summary_df["pass_like"], width, label="Pass-like", color="#5b9bd5")
    ax.bar(x + width / 2, summary_df["follow_up"], width, label="Follow-up", color="#ed7d31")
    ax.set_xticks(x)
    ax.set_xticklabels(summary_df["area"])
    ax.set_title("Cross-Area Quality Snapshot")
    ax.set_ylabel("Count")
    ax.legend()
    ax.grid(axis="y", alpha=0.25)
    fig.tight_layout()
    path = output_dir / "combined_quality_snapshot.png"
    fig.savefig(path, dpi=220, bbox_inches="tight")
    plt.close(fig)
    created.append(path)

    return created


def main() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    output_dir = repo_root / "tmp" / "docs" / "figures" / "assignment3"
    output_dir.mkdir(parents=True, exist_ok=True)

    perf_latest = read_json(repo_root / ".tmp" / "qa" / "experimental" / "performance" / "latest-performance-run.json")
    chaos_latest = read_json(repo_root / ".tmp" / "qa" / "experimental" / "chaos" / "latest-chaos-run.json")
    perf_summary = read_json(Path(perf_latest["summaryPath"]))
    mutation_summary = read_json(repo_root / ".tmp" / "qa" / "experimental" / "mutation" / "mutation-summary.json")
    chaos_summary = read_json(Path(chaos_latest["outputPath"]))

    created: list[Path] = []
    created.extend(build_performance_figures(perf_summary, output_dir))
    created.extend(build_mutation_figures(mutation_summary, output_dir))
    created.extend(build_chaos_figures(chaos_summary, output_dir))
    created.extend(build_combined_figure(perf_summary, mutation_summary, chaos_summary, output_dir))

    print(f"Generated {len(created)} figures/tables:")
    for path in created:
        print(path)


if __name__ == "__main__":
    main()
