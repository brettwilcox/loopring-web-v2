import { Button } from '../../basic-lib';
import { Box, Typography } from '@material-ui/core';

export const FailedUnlock = ()=>{
    return <Box>
        <Typography component={'h2'}>Failed Deposit</Typography>
        <Button onClick={()=>{
            //TODO
        }}>Retry</Button>
    </Box>
}