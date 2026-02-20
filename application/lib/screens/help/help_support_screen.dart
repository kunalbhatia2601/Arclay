import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../config/theme.dart';
import '../../config/constants.dart';
import '../../services/api_service.dart';
import 'policy_detail_screen.dart';

class HelpSupportScreen extends StatefulWidget {
  const HelpSupportScreen({super.key});

  @override
  State<HelpSupportScreen> createState() => _HelpSupportScreenState();
}

class _HelpSupportScreenState extends State<HelpSupportScreen> {
  final _apiService = ApiService();

  bool _isLoading = true;
  List<Map<String, dynamic>> _helpContacts = [];
  List<Map<String, dynamic>> _legalPolicies = [];
  List<Map<String, dynamic>> _faqs = [];

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    setState(() => _isLoading = true);

    final response = await _apiService.get<Map<String, dynamic>>(
      AppConstants.appConfigEndpoint,
      fromJson: (json) => json as Map<String, dynamic>,
    );

    if (!mounted) return;

    setState(() {
      if (response.success && response.data != null) {
        final config = response.data!['config'] as Map<String, dynamic>?;
        if (config != null) {
          _helpContacts =
              (config['helpContacts'] as List?)
                  ?.map((e) => Map<String, dynamic>.from(e))
                  .toList() ??
              [];
          _legalPolicies =
              (config['legalPolicies'] as List?)
                  ?.map((e) => Map<String, dynamic>.from(e))
                  .toList() ??
              [];
          _faqs =
              (config['faqs'] as List?)
                  ?.map((e) => Map<String, dynamic>.from(e))
                  .toList() ??
              [];
        }
      }
      _isLoading = false;
    });
  }

  Future<void> _launchContact(Map<String, dynamic> contact) async {
    final type = contact['type'] as String?;
    final value = contact['value'] as String?;
    if (value == null || value.isEmpty) return;

    Uri? uri;
    if (type == 'email') {
      uri = Uri(scheme: 'mailto', path: value);
    } else if (type == 'call') {
      uri = Uri(scheme: 'tel', path: value.replaceAll(' ', ''));
    }

    if (uri != null) {
      try {
        await launchUrl(uri);
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Could not open $value')));
        }
      }
    }
  }

  IconData _iconForContactType(String? type) {
    switch (type) {
      case 'email':
        return Icons.email_outlined;
      case 'call':
        return Icons.phone_outlined;
      case 'live_chat':
        return Icons.chat_outlined;
      default:
        return Icons.help_outline;
    }
  }

  Color _colorForContactType(String? type) {
    switch (type) {
      case 'email':
        return Colors.blue;
      case 'call':
        return Colors.green;
      case 'live_chat':
        return Colors.purple;
      default:
        return AppTheme.primaryColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Help & Support')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadConfig,
              child: ListView(
                padding: const EdgeInsets.all(AppTheme.spacing16),
                children: [
                  // ─── Contact Options ───
                  if (_helpContacts.isNotEmpty) ...[
                    Text(
                      'Get Help',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTheme.spacing12),
                    ..._helpContacts.map(_buildContactTile),
                    const SizedBox(height: AppTheme.spacing24),
                  ],

                  // ─── Legal & Policies ───
                  if (_legalPolicies.isNotEmpty) ...[
                    Text(
                      'Legal & Policies',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTheme.spacing12),
                    Card(
                      child: Column(
                        children: _legalPolicies.asMap().entries.map((entry) {
                          final index = entry.key;
                          final policy = entry.value;
                          return Column(
                            children: [
                              ListTile(
                                leading: const Icon(
                                  Icons.description_outlined,
                                  color: AppTheme.primaryColor,
                                ),
                                title: Text(policy['title'] ?? ''),
                                trailing: const Icon(Icons.chevron_right),
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => PolicyDetailScreen(
                                        title: policy['title'] ?? '',
                                        content: policy['content'] ?? '',
                                      ),
                                    ),
                                  );
                                },
                              ),
                              if (index < _legalPolicies.length - 1)
                                const Divider(height: 1),
                            ],
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: AppTheme.spacing24),
                  ],

                  // ─── FAQs ───
                  if (_faqs.isNotEmpty) ...[
                    Text(
                      'Frequently Asked Questions',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: AppTheme.spacing12),
                    Card(
                      child: ExpansionPanelList.radio(
                        elevation: 0,
                        expandedHeaderPadding: EdgeInsets.zero,
                        children: _faqs.asMap().entries.map((entry) {
                          final index = entry.key;
                          final faq = entry.value;
                          return ExpansionPanelRadio(
                            value: index,
                            headerBuilder: (_, isExpanded) => ListTile(
                              title: Text(
                                faq['question'] ?? '',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(fontWeight: FontWeight.w500),
                              ),
                            ),
                            body: Padding(
                              padding: const EdgeInsets.fromLTRB(
                                AppTheme.spacing16,
                                0,
                                AppTheme.spacing16,
                                AppTheme.spacing16,
                              ),
                              child: Text(
                                faq['answer'] ?? '',
                                style: Theme.of(context).textTheme.bodyMedium
                                    ?.copyWith(color: AppTheme.textSecondary),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],

                  // Copyright
                  const SizedBox(height: AppTheme.spacing48),
                  Text(
                    '© ${DateTime.now().year} ${AppConstants.appName}. All rights reserved.',
                    textAlign: TextAlign.center,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppTheme.textSecondary,
                    ),
                  ),
                  const SizedBox(height: AppTheme.spacing16),
                ],
              ),
            ),
    );
  }

  Widget _buildContactTile(Map<String, dynamic> contact) {
    final type = contact['type'] as String?;
    final label = contact['label'] as String? ?? '';
    final value = contact['value'] as String? ?? '';
    final color = _colorForContactType(type);

    return Card(
      margin: const EdgeInsets.only(bottom: AppTheme.spacing8),
      child: ListTile(
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(AppTheme.radiusMd),
          ),
          child: Icon(_iconForContactType(type), color: color),
        ),
        title: Text(label, style: const TextStyle(fontWeight: FontWeight.w500)),
        subtitle: Text(
          value,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: AppTheme.textSecondary),
        ),
        trailing: type == 'live_chat'
            ? null
            : Icon(
                type == 'email' ? Icons.open_in_new : Icons.call,
                size: 18,
                color: color,
              ),
        onTap: () => _launchContact(contact),
      ),
    );
  }
}
