import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';

const SECTION_SX = { mb: 3 };
const H2_SX = { fontWeight: 700, fontSize: '1.05rem', color: '#1B5E20', mb: 1 };
const BODY_SX = { fontSize: '0.9rem', lineHeight: 1.7, color: 'text.primary', mb: 1 };
const LI_SX = { fontSize: '0.9rem', lineHeight: 1.7, color: 'text.primary' };

/**
 * PrivacyPage - FitBuddy 개인정보 처리방침(로그인 불필요, 공개 접근)
 *
 * Android Health Connect의 PermissionsRationaleActivity가 여는 웹 페이지와 동일한 내용을
 * 유지해야 하므로(단일 진실 공급원), 문구를 수정할 때는 android의 rationale 화면도
 * 같은 URL을 그대로 열람하는지 함께 확인한다.
 */
export default function PrivacyPage() {
  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', py: { xs: 3, md: 5 } }}>
      <Container maxWidth='sm'>
        <Typography variant='h2' sx={{ fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.6rem' }, mb: 0.5 }}>
          FitBuddy 개인정보 처리방침
        </Typography>
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mb: 3 }}>
          최종 업데이트: 2026-08-17
        </Typography>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>1. 서비스 개요</Typography>
          <Typography sx={BODY_SX}>
            FitBuddy는 운동 기록과 커뮤니티 기능을 제공하는 서비스입니다. 이 문서는 FitBuddy 웹/PWA와
            Android 앱이 처리하는 정보를 실제 구현 기준으로 설명합니다.
          </Typography>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>2. 처리하는 정보</Typography>
          <Typography sx={BODY_SX}>회원가입·이용 과정에서 아래 정보가 처리됩니다.</Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component='li' sx={LI_SX}>계정 정보: 이메일, 비밀번호(인증 서비스에 저장)</Typography>
            <Typography component='li' sx={LI_SX}>프로필 정보: 닉네임, 자기소개, 키/몸무게/목표 체중, 운동 목표, 관심 운동, 성별, 프로필 사진</Typography>
            <Typography component='li' sx={LI_SX}>운동 기록: 운동 종류, 시간, 강도, 소모 칼로리, 운동 날짜</Typography>
            <Typography component='li' sx={LI_SX}>식단 기록: 식사 유형, 내용, 이미지, 칼로리</Typography>
            <Typography component='li' sx={LI_SX}>컨디션/운동 일기: 오늘의 컨디션, 일기 내용, 하루 운동 목표(분), 목표 달성 여부</Typography>
            <Typography component='li' sx={LI_SX}>게시글·댓글: 제목, 본문, 이미지, 해시태그, 댓글 내용</Typography>
            <Typography component='li' sx={LI_SX}>좋아요·저장·조회: 어떤 게시글에 좋아요/저장/조회했는지 여부(사용자-게시글 연결 정보)</Typography>
            <Typography component='li' sx={LI_SX}>챌린지: 생성·참여한 챌린지 정보</Typography>
            <Typography component='li' sx={LI_SX}>캐릭터/경험치: 레벨, 경험치(XP)</Typography>
          </Box>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>3. Health Connect 걸음 데이터 (Android 앱)</Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component='li' sx={LI_SX}>Android 앱은 Health Connect의 걸음 수 <strong>읽기 권한(READ_STEPS)만</strong> 요청합니다. 걸음을 새로 쓰는 권한(WRITE_STEPS)이나 다른 건강 데이터 권한은 요청하지 않습니다.</Typography>
            <Typography component='li' sx={LI_SX}>권한을 허용하면, 기기의 Health Connect가 이미 가지고 있는 오늘(자정~현재) 누적 걸음 수를 읽어와 홈 화면의 &quot;오늘의 걸음&quot; 카드에 표시합니다.</Typography>
            <Typography component='li' sx={LI_SX}>이 걸음 수는 운동 타이머 실행 여부와 관계없이 표시되는, 하루 전체 활동량입니다.</Typography>
            <Typography component='li' sx={LI_SX}>FitBuddy는 걸음 데이터를 Health Connect에 쓰지(기록하지) 않습니다.</Typography>
            <Typography component='li' sx={LI_SX}>FitBuddy 앱이 화면에 켜져 있는 동안에는, Health Connect 값이 갱신되기를 기다리지 않고 곧바로 숫자를 올려서 보여주기 위해 기기의 걸음 센서(신체 활동 인식)를 함께 사용합니다. 이때 별도로 Android의 신체 활동 인식 권한(ACTIVITY_RECOGNITION)을 추가로 요청하며, 거부해도 Health Connect 기반의 &quot;오늘의 걸음&quot; 기능 자체는 그대로 사용할 수 있습니다.</Typography>
            <Typography component='li' sx={LI_SX}>이 걸음 센서 값은 앱이 화면 앞에 떠 있을 때만 잠깐 사용되는 임시 값이며, 앱이 백그라운드로 전환되면 즉시 사용을 멈춥니다. 별도로 수집·저장하지 않고, 화면에 보여주는 용도로만 사용합니다.</Typography>
            <Typography component='li' sx={LI_SX}>이 걸음 수(Health Connect 값, 걸음 센서로 보정된 화면 표시 값 모두 포함)는 현재 FitBuddy 서버(Supabase)에 저장되지 않습니다. 화면에 표시할 때마다 기기에서 다시 읽어올 뿐입니다.</Typography>
            <Typography component='li' sx={LI_SX}>걸음 데이터를 랭킹, 광고, 마케팅 목적으로 사용하지 않습니다.</Typography>
          </Box>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>4. 정보 이용 목적</Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component='li' sx={LI_SX}>계정 정보 — 로그인 및 본인 확인</Typography>
            <Typography component='li' sx={LI_SX}>프로필 정보 — 프로필 화면 표시, 캐릭터 이미지 성별 반영</Typography>
            <Typography component='li' sx={LI_SX}>운동/식단/일기 기록 — 기록관, 홈 오늘 요약, 통계(연속 운동일 등) 표시</Typography>
            <Typography component='li' sx={LI_SX}>게시글·댓글·좋아요·저장 — 피드/커뮤니티 기능 제공</Typography>
            <Typography component='li' sx={LI_SX}>챌린지 — 챌린지 목록·참여 현황 제공</Typography>
            <Typography component='li' sx={LI_SX}>Health Connect 걸음 — 홈 화면의 &quot;오늘의 걸음&quot; 표시(Android 앱 전용)</Typography>
          </Box>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>5. 저장 및 보관</Typography>
          <Typography sx={BODY_SX}>
            위 2번 항목의 정보는 데이터베이스 서비스(Supabase)에 저장됩니다. 구체적인 보관 기간은
            별도로 정해두지 않았으며, 회원 탈퇴 시 아래 8번 항목에 따라 처리됩니다.
          </Typography>
          <Typography sx={BODY_SX}>
            Health Connect 걸음 데이터는 FitBuddy 서버에 저장되지 않고, 기기의 Health Connect에서
            그때그때 읽기만 합니다.
          </Typography>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>6. 외부 서비스</Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component='li' sx={LI_SX}>Supabase — 회원 인증, 데이터베이스, 프로필 이미지 저장소로 사용합니다.</Typography>
            <Typography component='li' sx={LI_SX}>GitHub Pages — FitBuddy 웹/PWA를 호스팅합니다.</Typography>
            <Typography component='li' sx={LI_SX}>Unsplash — 게시글 작성 시 선택할 수 있는 이미지 일부가 Unsplash에 호스팅되어 있어, 해당 이미지를 불러올 때 브라우저가 Unsplash 서버에 직접 접속합니다. 이 과정에서 FitBuddy가 회원 정보를 별도로 Unsplash에 전송하지 않습니다.</Typography>
            <Typography component='li' sx={LI_SX}>Android Health Connect — 3번 항목 참고.</Typography>
          </Box>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>7. 사용자 권한 및 선택</Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            <Typography component='li' sx={LI_SX}>Health Connect 걸음 권한은 언제든 허용/거부할 수 있습니다.</Typography>
            <Typography component='li' sx={LI_SX}>권한을 허용하지 않아도 로그인, 운동 기록, 피드, 챌린지 등 FitBuddy의 다른 핵심 기능은 그대로 사용할 수 있습니다.</Typography>
            <Typography component='li' sx={LI_SX}>이미 허용한 권한은 기기의 Health Connect 앱 설정에서 언제든 철회할 수 있습니다.</Typography>
          </Box>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>8. 계정 및 데이터 삭제</Typography>
          <Typography sx={BODY_SX}>
            프로필 화면에서 회원 탈퇴를 요청하면 아래 정보가 즉시 영구 삭제됩니다.
          </Typography>
          <Box component='ul' sx={{ pl: 2.5, m: 0, display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
            <Typography component='li' sx={LI_SX}>내가 만든 챌린지 및 해당 챌린지의 참여 기록, 내가 참여한 챌린지 기록</Typography>
            <Typography component='li' sx={LI_SX}>내 게시글, 그 게시글에 달린 좋아요·댓글</Typography>
            <Typography component='li' sx={LI_SX}>내가 남긴 좋아요·댓글·저장한 글 기록</Typography>
            <Typography component='li' sx={LI_SX}>운동·식단·컨디션(일기) 기록</Typography>
            <Typography component='li' sx={LI_SX}>캐릭터/경험치 정보</Typography>
            <Typography component='li' sx={LI_SX}>프로필 사진 파일(저장소에서 삭제)</Typography>
          </Box>
          <Typography sx={BODY_SX}>
            계정 자체(이메일 등 식별 정보가 담긴 프로필 행)는 즉시 완전히 삭제되지 않고
            비활성화(소프트 삭제) 상태로 전환되며, 로그인 시 탈퇴 계정으로 처리되어 다시 사용할 수 없습니다.
          </Typography>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>9. 연령 제한</Typography>
          <Typography sx={BODY_SX}>
            FitBuddy는 현재 별도의 연령 확인·제한 기능을 두고 있지 않습니다.
          </Typography>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>10. 개인정보 처리방침 변경</Typography>
          <Typography sx={BODY_SX}>
            이 문서의 내용은 서비스 변경에 따라 갱신될 수 있으며, 변경 시 이 페이지의
            &quot;최종 업데이트&quot; 날짜를 갱신합니다.
          </Typography>
        </Box>

        <Box sx={SECTION_SX}>
          <Typography sx={H2_SX}>11. 문의</Typography>
          <Typography sx={BODY_SX}>
            문의 사항은 GitHub 저장소 이슈를 통해 남겨주세요.
          </Typography>
          <Link
            href='https://github.com/Winter-Haeum/fitbuddy-sns/issues'
            target='_blank'
            rel='noopener noreferrer'
            sx={{ fontSize: '0.9rem', color: '#388E3C', fontWeight: 600 }}
          >
            github.com/Winter-Haeum/fitbuddy-sns/issues
          </Link>
        </Box>

        <Divider sx={{ my: 3 }} />
        <Typography variant='caption' color='text.secondary' sx={{ display: 'block', textAlign: 'center' }}>
          FitBuddy
        </Typography>
      </Container>
    </Box>
  );
}
