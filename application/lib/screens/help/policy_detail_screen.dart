import 'package:flutter/material.dart';
import '../../config/theme.dart';

class PolicyDetailScreen extends StatelessWidget {
  final String title;
  final String content;

  const PolicyDetailScreen({
    super.key,
    required this.title,
    required this.content,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppTheme.spacing16),
        child: Card(
          child: Padding(
            padding: const EdgeInsets.all(AppTheme.spacing16),
            child: _buildContent(context),
          ),
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context) {
    final lines = content.split('\n');
    final widgets = <Widget>[];

    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty) {
        widgets.add(const SizedBox(height: 8));
      } else if (trimmed.startsWith('## ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 16, bottom: 8),
            child: Text(
              trimmed.substring(3),
              style: Theme.of(
                context,
              ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (trimmed.startsWith('### ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(
              trimmed.substring(4),
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 8, top: 2, bottom: 2),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  '•  ',
                  style: TextStyle(color: AppTheme.primaryColor),
                ),
                Expanded(
                  child: _buildInlineFormatted(context, trimmed.substring(2)),
                ),
              ],
            ),
          ),
        );
      } else if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        // Simple table row — render as styled text
        final cells = trimmed
            .split('|')
            .where((c) => c.trim().isNotEmpty && !c.contains('---'))
            .map((c) => c.trim())
            .toList();
        if (cells.isNotEmpty && !trimmed.contains('---')) {
          widgets.add(
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 2),
              child: Row(
                children: cells.map((cell) {
                  return Expanded(
                    child: Text(
                      cell,
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          );
        }
      } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 2),
            child: Text(
              trimmed.replaceAll('**', ''),
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
        );
      } else if (trimmed.startsWith('1. ') ||
          trimmed.startsWith('2. ') ||
          trimmed.startsWith('3. ') ||
          trimmed.startsWith('4. ') ||
          trimmed.startsWith('5. ') ||
          trimmed.startsWith('6. ') ||
          trimmed.startsWith('7. ') ||
          trimmed.startsWith('8. ')) {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(left: 4, top: 2, bottom: 2),
            child: _buildInlineFormatted(context, trimmed),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: _buildInlineFormatted(context, trimmed),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildInlineFormatted(BuildContext context, String text) {
    // Simple bold parsing for **text**
    final spans = <TextSpan>[];
    final regex = RegExp(r'\*\*(.+?)\*\*');
    int lastEnd = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > lastEnd) {
        spans.add(TextSpan(text: text.substring(lastEnd, match.start)));
      }
      spans.add(
        TextSpan(
          text: match.group(1),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
      );
      lastEnd = match.end;
    }
    if (lastEnd < text.length) {
      spans.add(TextSpan(text: text.substring(lastEnd)));
    }

    return RichText(
      text: TextSpan(
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: AppTheme.textSecondary,
          height: 1.5,
        ),
        children: spans,
      ),
    );
  }
}
