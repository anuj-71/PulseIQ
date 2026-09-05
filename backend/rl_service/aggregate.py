import numpy as np
from collections import Counter


class Aggregator:
    @staticmethod
    def kmeans_cluster(data, k=4, iters=10, n_init=10):
        if len(data) == 0:
            return []

        best_labels = None
        best_inertia = float('inf')

        for _ in range(n_init):
            # Initialize centroids randomly from data points
            indices = np.random.choice(
                len(data), size=min(k, len(data)), replace=False)
            centroids = data[indices]

            labels = np.zeros(len(data))
            for _ in range(iters):
                # Assign clusters
                distances = np.linalg.norm(
                    data[:, np.newaxis] - centroids, axis=2)
                labels = np.argmin(distances, axis=1)

                # Update centroids
                new_centroids = []
                for i in range(k):
                    cluster_pts = data[labels == i]
                    if len(cluster_pts) > 0:
                        new_centroids.append(cluster_pts.mean(axis=0))
                    else:
                        new_centroids.append(centroids[i])
                centroids = np.array(new_centroids)

            # Compute inertia
            distances = np.linalg.norm(data[:, np.newaxis] - centroids, axis=2)
            inertia = np.sum(np.min(distances, axis=1)**2)

            if inertia < best_inertia:
                best_inertia = inertia
                best_labels = labels

        return best_labels

    @staticmethod
    def generate_report(store):
        records = store.action_log
        outcomes = store.outcome_log

        if not records:
            return "No data to aggregate."

        outcome_map = {o['user_id']: o['engagement_delta'] for o in outcomes}
        features_list = ['usage_decline', 'negative_sentiment',
                         'support_delay', 'onboarding_gap']

        data = []
        for r in records:
            attrs = {a['feature']: a['impact'] for a in r['attributions']}
            vec = [attrs.get(f, 0.0) for f in features_list]
            data.append(vec)

        data = np.array(data)
        labels = Aggregator.kmeans_cluster(data, k=4, n_init=10)

        report_lines = []
        n_total = len(records)

        for i in range(4):
            cluster_indices = np.where(labels == i)[0]
            if len(cluster_indices) == 0:
                continue

            cluster_size = len(cluster_indices)
            pct = (cluster_size / n_total) * 100

            # Find dominant feature for cluster by finding max positive signed average impact
            cluster_data = data[cluster_indices]
            mean_vec = cluster_data.mean(axis=0)
            dominant_idx = np.argmax(mean_vec)
            dominant_cause = features_list[dominant_idx]

            actions_taken = [records[idx]['action'] for idx in cluster_indices]
            most_common_action = Counter(actions_taken).most_common(1)[0][0]

            avg_outcome = np.mean(
                [outcome_map.get(records[idx]['user_id'], 0.0) for idx in cluster_indices])

            report_lines.append(
                f"{pct:.0f}% of users - dominant cause: {dominant_cause} - recommended action: {most_common_action} - avg outcome: {avg_outcome:+.2f} engagement")

        return "\n".join(report_lines)
