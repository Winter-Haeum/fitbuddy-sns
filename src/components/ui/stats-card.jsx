import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

/**
 * StatsCard - 통계 수치 표시 카드
 *
 * Props:
 * @param {React.ReactNode} icon     - 상단 아이콘 [Required]
 * @param {string|number}  value    - 표시할 값 [Required]
 * @param {string}         unit     - 단위 or 라벨 텍스트 [Required]
 * @param {string}         bgcolor  - 카드 배경색 [Required]
 * @param {string}         color    - 아이콘·값 색상 [Required]
 * @param {function}       onClick  - 클릭 핸들러 (없으면 정적) [Optional]
 * @param {boolean}        compact  - true이면 작은 폰트 (4분할 레이아웃용) [Optional, 기본값: false]
 *
 * Example usage:
 * <StatsCard icon={<TimerIcon />} value={45} unit="분" bgcolor="#E8F5E9" color="#4CAF5A" onClick={handleClick} />
 */
export default function StatsCard({ icon, value, unit, bgcolor, color, onClick, compact = false }) {
  const isClickable = typeof onClick === 'function';

  return (
    <Card
      onClick={onClick}
      sx={{
        textAlign: 'center',
        bgcolor,
        cursor: isClickable ? 'pointer' : 'default',
        transition: isClickable ? 'transform 0.12s ease, box-shadow 0.15s ease' : undefined,
        ...(isClickable && {
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transform: 'translateY(-1px)' },
          '&:active': { transform: 'scale(0.96)', boxShadow: 'none' },
        }),
      }}
    >
      <CardContent sx={{ py: 1.5, px: compact ? 0.5 : 1 }}>
        <Box sx={{ color }}>{icon}</Box>
        <Typography
          variant='h4'
          sx={{ fontWeight: 700, color, fontSize: compact ? '1.1rem' : undefined }}
        >
          {value}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={compact ? { fontSize: '0.65rem' } : undefined}
        >
          {unit}
        </Typography>
      </CardContent>
    </Card>
  );
}
