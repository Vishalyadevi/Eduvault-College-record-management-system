import { autoAllocateSemesterData } from '../services/semesterAutoAllocationService.js';

const parseArgs = () => {
  const parsed = {
    semesterNumber: 6,
    batch: null,
    branch: null,
    departmentId: null,
    replaceExisting: true,
  };

  for (const arg of process.argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const [key, rawValue] = arg.slice(2).split('=');
    const value = rawValue ?? 'true';

    if (key === 'semester' || key === 'semesterNumber') parsed.semesterNumber = Number.parseInt(value, 10);
    if (key === 'batch') parsed.batch = value;
    if (key === 'branch') parsed.branch = value;
    if (key === 'departmentId') parsed.departmentId = Number.parseInt(value, 10);
    if (key === 'replaceExisting') parsed.replaceExisting = value !== 'false';
  }

  return parsed;
};

const main = async () => {
  const result = await autoAllocateSemesterData({
    ...parseArgs(),
    actor: 'semester-auto-script',
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
};

main().catch((error) => {
  console.error('Semester auto allocation failed:', error.message || error);
  process.exit(1);
});
