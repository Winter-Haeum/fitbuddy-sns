import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useFontScale } from '../../hooks/use-font-scale';

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
  // compact 모드의 고정 rem 리터럴이 h4/caption variant를 덮어써 글자 크기 설정을 우회하고
  // 있었다 — es()로 바꿔 4단계 스케일에 맞춰 함께 커지고 작아지게 한다.
  const { scaleRem: es } = useFontScale();

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
      {/* compact(마이페이지 4분할) 모드만 대상 — 아이콘/숫자/라벨 세로 간격을 CardContent의
          py + MUI 기본 :last-child 24px padding-bottom에 기대는 대신 flex column + gap으로
          직접 통제한다. 최초 압축(py 1/gap 0.3/pb 1.25)이 실기기에서 "너무 타이트하다"는
          피드백을 받아 상하 padding과 요소 간 gap을 약 20% 다시 늘렸다 — 수정 전(py 1.5,
          gap 없음, MUI 기본 pb 24px)보다는 훨씬 압축된 채로, 첫 압축판보다만 살짝 여유를
          더 준 상태다. 상단(1.2)보다 하단(1.5)이 살짝 더 크다. compact가 아닌 Home 등 기존
          사용처는 이 카드가 렌더링될 때 아무 값도 바뀌지 않는다(아래 모든 분기가 compact일
          때만 새 값을 준다). */}
      <CardContent
        sx={{
          py: compact ? 1.2 : 1.5,
          px: compact ? 0.5 : 1,
          ...(compact && {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0.4,
            '&:last-child': { pb: 1.5 },
          }),
        }}
      >
        <Box sx={{ color, ...(compact && { display: 'flex' }) }}>{icon}</Box>
        <Typography
          variant='h4'
          sx={{ fontWeight: 700, color, fontSize: compact ? es(1.1) : undefined, ...(compact && { lineHeight: 1.2 }) }}
        >
          {value}
        </Typography>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={compact ? { fontSize: es(0.65), lineHeight: 1.2 } : undefined}
        >
          {unit}
        </Typography>
      </CardContent>
    </Card>
  );
}
