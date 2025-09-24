import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:pharmaci/core/design_system/tokens/app_colors.dart';
import 'package:pharmaci/core/design_system/tokens/app_spacing.dart';
import 'package:pharmaci/core/design_system/tokens/app_text_styles.dart';
import 'package:pharmaci/presentation/providers/simple_auth_provider.dart';
import 'package:pharmaci/core/app/app.dart';

class SimpleLoginScreen extends StatefulWidget {
  const SimpleLoginScreen({super.key});

  @override
  State<SimpleLoginScreen> createState() => _SimpleLoginScreenState();
}

class _SimpleLoginScreenState extends State<SimpleLoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      final ok = await context.read<SimpleAuthProvider>().signIn(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
      if (!mounted) return;
      if (!ok) {
        final err = context.read<SimpleAuthProvider>().error ??
            'Email ou mot de passe incorrect';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppColors.error),
        );
      } else {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const HomeScreen()),
          (route) => false,
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        title: const Text('Login'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.large),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSpacing.xxLarge),
                // Logo
                Center(
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Image.asset(
                          'assets/img/logo512.png',
                          width: 190,
                          height: 190,
                          fit: BoxFit.cover,
                        ),
                      ),
                      
                    ],
                  ),
                ),

                const SizedBox(height: AppSpacing.xLarge),

                // Email
                _ShadowField(
                  child: TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'Email or Username',
                      prefixIcon: Icon(Icons.person_outline, color: Colors.orange),
                    ),
                    validator: (v) =>
                        (v == null || v.trim().isEmpty) ? 'Email requis' : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.medium),

                // Password
                _ShadowField(
                  child: TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    decoration: InputDecoration(
                      hintText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline, color: Colors.orange),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off
                              : Icons.visibility,
                          color: Colors.grey,
                        ),
                        onPressed: () => setState(
                            () => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (v) => (v == null || v.isEmpty)
                        ? 'Mot de passe requis'
                        : null,
                  ),
                ),

                const SizedBox(height: AppSpacing.small),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (_) => const ForgotPasswordScreen()),
                    ),
                    style: TextButton.styleFrom(minimumSize: Size.zero, padding: EdgeInsets.zero),
                    child: const Text('Forgot Password?'),
                  ),
                ),

                const SizedBox(height: AppSpacing.large),

                // Login button - TODO: Ajouter icône login ici
                ElevatedButton.icon(
                  onPressed: _loading ? null : _handleLogin,
                  icon: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                        )
                      : const Icon(Icons.login), // TODO: Icône de connexion
                  label: _loading ? const Text('') : const Text('Login'),
                ),

                const SizedBox(height: AppSpacing.large),

                // Or divider
                Row(
                  children: [
                    const Expanded(child: Divider()),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text('Or login with', style: AppTextStyles.caption),
                    ),
                    const Expanded(child: Divider()),
                  ],
                ),

                const SizedBox(height: AppSpacing.medium),

                // Social buttons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.g_mobiledata, size: 28),
                        label: const Text('Google'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.medium),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {},
                        icon: const Icon(Icons.facebook, size: 20),
                        label: const Text('Facebook'),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: AppSpacing.xLarge),

                // Sign up link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account? "),
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const SimpleRegisterScreen()),
                      ),
                      child: Text(
                        'Sign Up',
                        style: AppTextStyles.primary.copyWith(fontWeight: FontWeight.w600),
                      ),
                    )
                  ],
                ),
                const SizedBox(height: AppSpacing.xLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class SimpleRegisterScreen extends StatefulWidget {
  const SimpleRegisterScreen({super.key});

  @override
  State<SimpleRegisterScreen> createState() => _SimpleRegisterScreenState();
}

class _SimpleRegisterScreenState extends State<SimpleRegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  bool _obscure1 = true;
  bool _obscure2 = true;
  bool _terms = false;
  bool _loading = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _phone.dispose();
    _password.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_terms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez accepter les conditions d\'utilisation')), 
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final ok = await context.read<SimpleAuthProvider>().signUp(
            email: _email.text.trim(),
            password: _password.text,
            firstName: _firstName.text.trim(),
            lastName: _lastName.text.trim(),
            phone: _phone.text.trim(),
          );
      if (!mounted) return;
      if (ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Compte créé. Connectez-vous.')),
        );
        Navigator.pop(context);
      } else {
        final err = context.read<SimpleAuthProvider>().error ?? 'Erreur inconnue';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(err), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        centerTitle: true,
        title: const Text('Sign Up'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.large),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: AppSpacing.large),
                // Logo
                Center(
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(18),
                        child: Image.asset(
                          'assets/img/logo512.png',
                          width: 190,
                          height: 190,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: AppSpacing.xLarge),
                // Name
                _ShadowField(
                  child: TextFormField(
                    controller: _firstName,
                    decoration: const InputDecoration(
                      hintText: 'Full Name',
                      prefixIcon: Icon(Icons.person_outline, color: Colors.orange),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Nom requis'
                        : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.medium),
                // Email
                _ShadowField(
                  child: TextFormField(
                    controller: _email,
                    keyboardType: TextInputType.emailAddress,
                    decoration: const InputDecoration(
                      hintText: 'Email',
                      prefixIcon: Icon(Icons.email_outlined, color: Colors.orange),
                    ),
                    validator: (v) => (v == null || v.trim().isEmpty)
                        ? 'Email requis'
                        : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.medium),
                // Password
                _ShadowField(
                  child: TextFormField(
                    controller: _password,
                    obscureText: _obscure1,
                    decoration: InputDecoration(
                      hintText: 'Password',
                      prefixIcon: const Icon(Icons.lock_outline, color: Colors.orange),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure1 ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscure1 = !_obscure1),
                      ),
                    ),
                    validator: (v) => (v == null || v.length < 6)
                        ? 'Au moins 6 caractères'
                        : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.medium),
                // Confirm Password
                _ShadowField(
                  child: TextFormField(
                    controller: _confirm,
                    obscureText: _obscure2,
                    decoration: InputDecoration(
                      hintText: 'Confirm Password',
                      prefixIcon: const Icon(Icons.lock_outline, color: Colors.orange),
                      suffixIcon: IconButton(
                        icon: Icon(_obscure2 ? Icons.visibility_off : Icons.visibility),
                        onPressed: () => setState(() => _obscure2 = !_obscure2),
                      ),
                    ),
                    validator: (v) => (v != _password.text)
                        ? 'Les mots de passe ne correspondent pas'
                        : null,
                  ),
                ),
                const SizedBox(height: AppSpacing.medium),
                // Phone
                _ShadowField(
                  child: TextFormField(
                    controller: _phone,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      hintText: 'Phone',
                      prefixIcon: Icon(Icons.phone_outlined, color: Colors.orange),
                    ),
                  ),
                ),

                const SizedBox(height: AppSpacing.medium),
                Row(
                  children: [
                    Checkbox(
                      value: _terms,
                      onChanged: (v) => setState(() => _terms = v ?? false),
                    ),
                    const SizedBox(width: 4),
                    const Expanded(
                      child: Text.rich(
                        TextSpan(
                          text: 'I agree to the ',
                          children: [
                            TextSpan(
                              text: 'Terms and Conditions',
                              style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                              ),
                            )
                          ],
                        ),
                      ),
                    )
                  ],
                ),

                const SizedBox(height: AppSpacing.large),
                // Sign Up button - TODO: Ajouter icône person_add ici
                ElevatedButton.icon(
                  onPressed: _loading ? null : _handleRegister,
                  icon: _loading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                        )
                      : const Icon(Icons.person_add), // TODO: Icône d'inscription
                  label: _loading ? const Text('') : const Text('Sign Up'),
                ),

                const SizedBox(height: AppSpacing.large),
                Center(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Text('Already have an account? Sign In',
                        style: AppTextStyles.primary.copyWith(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(height: AppSpacing.xLarge),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailOrPhone = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _emailOrPhone.dispose();
    super.dispose();
  }

  Future<void> _sendReset() async {
    final value = _emailOrPhone.text.trim();
    if (value.isEmpty) return;
    if (!value.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez entrer un email valide')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<SimpleAuthProvider>().resetPassword(value);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Lien de réinitialisation envoyé')),
      );
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const OtpVerificationScreen()),
      );
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        foregroundColor: AppColors.textPrimary,
        title: const Text('Password Reset'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.large),
        child: Column(
          children: [
            const SizedBox(height: AppSpacing.xLarge),
            // Logo
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.asset(
                      'assets/img/logo512.png',
                      width: 190,
                      height: 190,
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xLarge),
            Text('Forgot Your Password?', style: AppTextStyles.headline3),
            const SizedBox(height: AppSpacing.small),
            const Text(
              "No problem. Enter your email or phone number below and we'll send you a reset link.",
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xLarge),
            _ShadowField(
              child: TextField(
                controller: _emailOrPhone,
                decoration: const InputDecoration(
                  hintText: 'Email or Phone Number',
                  prefixIcon: Icon(Icons.email_outlined, color: Colors.orange),
                ),
              ),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _sendReset,
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                    : const Text('Send Reset Link'),
              ),
            ),
            const SizedBox(height: AppSpacing.large),
          ],
        ),
      ),
    );
  }
}

class OtpVerificationScreen extends StatefulWidget {
  const OtpVerificationScreen({super.key});

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());
  final List<TextEditingController> _ctls =
      List.generate(6, (_) => TextEditingController());

  @override
  void dispose() {
    for (final n in _nodes) n.dispose();
    for (final c in _ctls) c.dispose();
    super.dispose();
  }

  void _verify() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const NewPasswordScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Reset Password'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.textPrimary,
        centerTitle: true,
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.large),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            const SizedBox(height: AppSpacing.xLarge),
            // Logo
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.asset(
                      'assets/img/logo512.png',
                      width: 190,
                      height: 190,
                      fit: BoxFit.cover,
                    ),
                  ),
                  
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xLarge),
            Text('Enter Verification Code', style: AppTextStyles.headline3),
            const SizedBox(height: AppSpacing.small),
            const Text(
              'We sent a 6-digit code to your registered email/phone number.',
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.xLarge),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(6, (i) {
                return _OtpBox(
                  controller: _ctls[i],
                  focusNode: _nodes[i],
                  onChanged: (val) {
                    if (val.isNotEmpty && i < 5) {
                      _nodes[i + 1].requestFocus();
                    }
                  },
                );
              }),
            ),
            const SizedBox(height: AppSpacing.large),
            TextButton(
              onPressed: () {},
              child: Text('Resend Code', style: AppTextStyles.primary),
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _verify,
                child: const Text('Verify'),
              ),
            ),
            const SizedBox(height: AppSpacing.large),
          ],
        ),
      ),
    );
  }
}

class NewPasswordScreen extends StatefulWidget {
  const NewPasswordScreen({super.key});

  @override
  State<NewPasswordScreen> createState() => _NewPasswordScreenState();
}

class _NewPasswordScreenState extends State<NewPasswordScreen> {
  final _newPwd = TextEditingController();
  final _confirmPwd = TextEditingController();
  bool _ob1 = true;
  bool _ob2 = true;
  bool _show = false;

  @override
  void dispose() {
    _newPwd.dispose();
    _confirmPwd.dispose();
    super.dispose();
  }

  void _reset() {
    if (_newPwd.text != _confirmPwd.text || _newPwd.text.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vérifiez les mots de passe.')),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Password reset successful')),
    );
    Navigator.popUntil(context, (r) => r.isFirst);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        foregroundColor: AppColors.textPrimary,
        centerTitle: true,
        title: const Text('Set a New Password'),
      ),
      body: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.large),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: AppSpacing.large),
            // Logo
            Center(
              child: Column(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(18),
                    child: Image.asset(
                      'assets/img/logo512.png',
                      width: 190,
                      height: 190,
                      fit: BoxFit.cover,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.xLarge),
            const Text(
              'Your new password must be different from previously used passwords.',
            ),
            const SizedBox(height: AppSpacing.large),
            _ShadowField(
              child: TextField(
                controller: _newPwd,
                obscureText: _ob1,
                decoration: InputDecoration(
                  hintText: 'Enter new password',
                  prefixIcon: const Icon(Icons.lock_outline, color: Colors.orange),
                  suffixIcon: IconButton(
                    icon: Icon(_ob1 ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _ob1 = !_ob1),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.medium),
            _ShadowField(
              child: TextField(
                controller: _confirmPwd,
                obscureText: _ob2,
                decoration: InputDecoration(
                  hintText: 'Confirm new password',
                  prefixIcon: const Icon(Icons.lock_outline, color: Colors.orange),
                  suffixIcon: IconButton(
                    icon: Icon(_ob2 ? Icons.visibility_off : Icons.visibility),
                    onPressed: () => setState(() => _ob2 = !_ob2),
                  ),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.small),
            Row(
              children: [
                Checkbox(
                  value: _show,
                  onChanged: (v) => setState(() {
                    _show = v ?? false;
                    _ob1 = !_show;
                    _ob2 = !_show;
                  }),
                ),
                const Text('Show password'),
              ],
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _reset,
                icon: const Icon(Icons.lock_reset),
                label: const Text('Reset Password'),
              ),
            ),
            const SizedBox(height: AppSpacing.large),
          ],
        ),
      ),
    );
  }
}

// Small helper widgets to match the card-like input fields with subtle shadow
class _ShadowField extends StatelessWidget {
  final Widget child;
  const _ShadowField({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLarge),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: child,
    );
  }
}

class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String>? onChanged;
  const _OtpBox({required this.controller, required this.focusNode, this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 44,
      height: 56,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      alignment: Alignment.center,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        textAlign: TextAlign.center,
        keyboardType: TextInputType.number,
        maxLength: 1,
        decoration: const InputDecoration(
          counterText: '',
          border: InputBorder.none,
        ),
        onChanged: onChanged,
      ),
    );
  }
}
