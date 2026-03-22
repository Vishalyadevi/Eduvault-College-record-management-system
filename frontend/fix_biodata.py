import re

path = r'c:\Users\moni\Eduvault-College-record-management-system\frontend\src\records\pages\StaffPage\StaffBioData.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the duplicate StaffBioData and merge the return
# The previous multi_replace might have left a mess.
# I'll just do a global cleanup.

# 1. Ensure CollapsibleSection is defined ONCE at the top
# (It might be there twice now if multi_replace succeeded part 1 but failed part 2)

# 2. Pattern for CollapsibleSection calls:
# <CollapsibleSection
#     title="Personal Details"
#     icon={User}
#     sectionKey="personal"
#     count={0}
# >
def replace_collapsible(match):
    title = match.group(1)
    icon = match.group(2)
    s_key = match.group(3)
    count = match.group(4)
    return f'''<CollapsibleSection
                title="{title}"
                icon={{{icon}}}
                sectionKey="{s_key}"
                count={{{count}}}
                isOpen={{{s_key in ['personal', 'education'] if 'openSections' not in locals() else 'openSections["' + s_key + '"]'}}}
                onToggle={{toggleSection}}
            >'''

# Correct usage replacement
# Note: In StaffBioData, openSections is a state. So we should use openSections[sectionKey].
new_content = re.sub(
    r'<CollapsibleSection\s+title="([^"]+)"\s+icon=\{([^}]+)\}\s+sectionKey="([^"]+)"\s+count=\{([^}]+)\}\s*>',
    r'<CollapsibleSection title="\1" icon={\2} sectionKey="\3" count={\4} isOpen={openSections["\3"]} onToggle={toggleSection}>',
    content
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
