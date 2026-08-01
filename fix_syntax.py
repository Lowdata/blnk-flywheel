import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# We need to add the closing braces for handleClaimCardInvite
# Replace:
#       toast({ title: 'Failed to claim referral code', status: 'error' });
#     return (
# With:
#       toast({ title: 'Failed to claim referral code', status: 'error' });
#     }
#   };
#
#   return (
content = content.replace("      toast({ title: 'Failed to claim referral code', status: 'error' });\n    return (", "      toast({ title: 'Failed to claim referral code', status: 'error' });\n    }\n  };\n\n  return (")

with open('app/page.tsx', 'w') as f:
    f.write(content)

print("Fixed syntax")
